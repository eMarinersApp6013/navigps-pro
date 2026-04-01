package com.emarinersapp.gnss;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.GnssMeasurement;
import android.location.GnssMeasurementsEvent;
import android.location.GnssNavigationMessage;
import android.location.GnssStatus;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * GnssEnginePlugin — Capacitor plugin for raw GNSS satellite access
 *
 * Provides:
 * 1. Raw GNSS measurements (pseudoranges) from all constellations
 * 2. Per-satellite data (SNR, elevation, azimuth, constellation, used-in-fix)
 * 3. Constellation filtering (use only GPS, only Galileo, etc.)
 * 4. Independent position computation per constellation
 * 5. GPS spoofing detection by cross-checking constellation fixes
 *
 * Android API 24+ required for GnssMeasurements
 * Android API 26+ recommended for full constellation support
 */
@CapacitorPlugin(
    name = "GnssEngine",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        )
    }
)
public class GnssEnginePlugin extends Plugin {

    private static final String TAG = "GnssEngine";
    private static final double SPEED_OF_LIGHT = 299792458.0; // m/s
    private static final double SPOOFING_THRESHOLD_METERS = 500.0;

    private LocationManager locationManager;
    private GnssPositionSolver positionSolver;
    private Handler mainHandler;

    // State
    private boolean measurementsActive = false;
    private Map<String, Boolean> enabledConstellations = new HashMap<>();
    private String primaryConstellation = "AUTO"; // AUTO uses best available
    private List<SatelliteInfo> currentSatellites = new ArrayList<>();
    private Map<String, double[]> constellationFixes = new HashMap<>(); // constellation -> [lat, lon, accuracy]

    // Callbacks
    private GnssMeasurementsEvent.Callback measurementsCallback;
    private GnssStatus.Callback statusCallback;
    private GnssNavigationMessage.Callback navMessageCallback;

    @Override
    public void load() {
        locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        positionSolver = new GnssPositionSolver();
        mainHandler = new Handler(Looper.getMainLooper());

        // Default: all major constellations enabled
        enabledConstellations.put("GPS", true);
        enabledConstellations.put("GLONASS", true);
        enabledConstellations.put("GALILEO", true);
        enabledConstellations.put("BEIDOU", true);
        enabledConstellations.put("NAVIC", false);
        enabledConstellations.put("QZSS", false);
        enabledConstellations.put("SBAS", true);

        Log.i(TAG, "GnssEngine plugin loaded");
    }

    // ======================== PLUGIN METHODS ========================

    @PluginMethod
    public void startMeasurements(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            call.reject("GNSS measurements require Android 7.0 (API 24) or higher");
            return;
        }

        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }

        startGnssListeners();
        measurementsActive = true;
        call.resolve(new JSObject().put("started", true));
    }

    @PluginMethod
    public void stopMeasurements(PluginCall call) {
        stopGnssListeners();
        measurementsActive = false;
        call.resolve(new JSObject().put("stopped", true));
    }

    @PluginMethod
    public void setConstellations(PluginCall call) {
        Boolean gps = call.getBoolean("gps", true);
        Boolean glonass = call.getBoolean("glonass", true);
        Boolean galileo = call.getBoolean("galileo", true);
        Boolean beidou = call.getBoolean("beidou", true);
        Boolean navic = call.getBoolean("navic", false);
        Boolean qzss = call.getBoolean("qzss", false);
        Boolean sbas = call.getBoolean("sbas", true);

        enabledConstellations.put("GPS", gps);
        enabledConstellations.put("GLONASS", glonass);
        enabledConstellations.put("GALILEO", galileo);
        enabledConstellations.put("BEIDOU", beidou);
        enabledConstellations.put("NAVIC", navic);
        enabledConstellations.put("QZSS", qzss);
        enabledConstellations.put("SBAS", sbas);

        Log.i(TAG, "Constellations updated: " + enabledConstellations);
        call.resolve(new JSObject().put("constellations", enabledConstellations.toString()));
    }

    @PluginMethod
    public void setPrimary(PluginCall call) {
        String constellation = call.getString("constellation", "AUTO");
        primaryConstellation = constellation.toUpperCase();
        Log.i(TAG, "Primary constellation set to: " + primaryConstellation);
        call.resolve(new JSObject().put("primary", primaryConstellation));
    }

    @PluginMethod
    public void getSatellites(PluginCall call) {
        JSObject result = new JSObject();
        JSArray satsArray = new JSArray();
        for (SatelliteInfo sat : currentSatellites) {
            satsArray.put(sat.toJSON());
        }
        result.put("satellites", satsArray);
        result.put("count", currentSatellites.size());
        call.resolve(result);
    }

    @PluginMethod
    public void getConstellationFixes(PluginCall call) {
        JSObject result = new JSObject();
        for (Map.Entry<String, double[]> entry : constellationFixes.entrySet()) {
            JSObject fix = new JSObject();
            fix.put("lat", entry.getValue()[0]);
            fix.put("lon", entry.getValue()[1]);
            fix.put("accuracy", entry.getValue()[2]);
            result.put(entry.getKey(), fix);
        }
        call.resolve(result);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            startGnssListeners();
            measurementsActive = true;
            call.resolve(new JSObject().put("started", true));
        } else {
            call.reject("Location permission denied");
        }
    }

    // ======================== GNSS LISTENERS ========================

    private void startGnssListeners() {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        // 1. GNSS Status — satellite visibility (SNR, elevation, azimuth)
        statusCallback = new GnssStatus.Callback() {
            @Override
            public void onSatelliteStatusChanged(@NonNull GnssStatus status) {
                processSatelliteStatus(status);
            }

            @Override
            public void onStarted() {
                Log.i(TAG, "GNSS status tracking started");
            }

            @Override
            public void onStopped() {
                Log.i(TAG, "GNSS status tracking stopped");
            }
        };
        locationManager.registerGnssStatusCallback(statusCallback, mainHandler);

        // 2. GNSS Measurements — raw pseudoranges (API 24+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            measurementsCallback = new GnssMeasurementsEvent.Callback() {
                @Override
                public void onGnssMeasurementsReceived(GnssMeasurementsEvent event) {
                    processRawMeasurements(event);
                }

                @Override
                public void onStatusChanged(int status) {
                    Log.d(TAG, "Measurement status changed: " + status);
                }
            };
            locationManager.registerGnssMeasurementsCallback(measurementsCallback, mainHandler);
        }

        // 3. Navigation Messages — ephemeris data (API 24+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            navMessageCallback = new GnssNavigationMessage.Callback() {
                @Override
                public void onGnssNavigationMessageReceived(GnssNavigationMessage message) {
                    positionSolver.processNavigationMessage(message);
                }

                @Override
                public void onStatusChanged(int status) {
                    // Status change
                }
            };
            locationManager.registerGnssNavigationMessageCallback(navMessageCallback, mainHandler);
        }

        // 4. Location updates (fallback + speed/bearing)
        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER, 1000, 0,
            new LocationListener() {
                @Override
                public void onLocationChanged(@NonNull Location location) {
                    processLocationUpdate(location);
                }

                @Override
                public void onProviderEnabled(@NonNull String provider) {}
                @Override
                public void onProviderDisabled(@NonNull String provider) {}
            },
            mainHandler.getLooper()
        );

        Log.i(TAG, "All GNSS listeners registered");
    }

    private void stopGnssListeners() {
        if (locationManager == null) return;

        if (statusCallback != null) {
            locationManager.unregisterGnssStatusCallback(statusCallback);
            statusCallback = null;
        }
        if (measurementsCallback != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            locationManager.unregisterGnssMeasurementsCallback(measurementsCallback);
            measurementsCallback = null;
        }
        if (navMessageCallback != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            locationManager.unregisterGnssNavigationMessageCallback(navMessageCallback);
            navMessageCallback = null;
        }
        Log.i(TAG, "GNSS listeners unregistered");
    }

    // ======================== DATA PROCESSING ========================

    /**
     * Process satellite status — visibility, SNR, elevation, azimuth
     */
    private void processSatelliteStatus(GnssStatus status) {
        currentSatellites.clear();
        Map<String, Integer> constellationCounts = new HashMap<>();

        for (int i = 0; i < status.getSatelliteCount(); i++) {
            SatelliteInfo sat = new SatelliteInfo();
            sat.svid = status.getSvid(i);
            sat.constellationType = status.getConstellationType(i);
            sat.constellation = getConstellationName(sat.constellationType);
            sat.cn0DbHz = status.getCn0DbHz(i);
            sat.elevation = status.getElevationDegrees(i);
            sat.azimuth = status.getAzimuthDegrees(i);
            sat.usedInFix = status.usedInFix(i);
            sat.hasAlmanac = status.hasAlmanacData(i);
            sat.hasEphemeris = status.hasEphemerisData(i);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                sat.carrierFrequencyHz = status.hasCarrierFrequencyHz(i)
                    ? status.getCarrierFrequencyHz(i) : 0;
            }

            // Filter by user's constellation selection
            Boolean enabled = enabledConstellations.get(sat.constellation);
            if (enabled != null && enabled) {
                currentSatellites.add(sat);
            }

            // Count all visible regardless of filter
            constellationCounts.put(sat.constellation,
                (constellationCounts.containsKey(sat.constellation)
                    ? constellationCounts.get(sat.constellation) : 0) + 1);
        }

        // Notify JS layer
        JSObject data = new JSObject();
        JSArray satsArray = new JSArray();
        for (SatelliteInfo sat : currentSatellites) {
            satsArray.put(sat.toJSON());
        }
        data.put("satellites", satsArray);
        data.put("totalCount", status.getSatelliteCount());
        data.put("filteredCount", currentSatellites.size());

        JSObject counts = new JSObject();
        for (Map.Entry<String, Integer> entry : constellationCounts.entrySet()) {
            counts.put(entry.getKey(), entry.getValue());
        }
        data.put("constellationCounts", counts);

        notifyListeners("onSatelliteUpdate", data);
    }

    /**
     * Process raw GNSS measurements — pseudoranges for position computation
     */
    private void processRawMeasurements(GnssMeasurementsEvent event) {
        Collection<GnssMeasurement> measurements = event.getMeasurements();
        long clockTimeNanos = event.getClock().getTimeNanos();
        long fullBiasNanos = event.getClock().getFullBiasNanos();
        double biasNanos = event.getClock().getBiasNanos();

        // Group measurements by constellation
        Map<String, List<RawMeasurement>> byConstellation = new HashMap<>();

        for (GnssMeasurement m : measurements) {
            // Only use measurements with valid state
            if ((m.getState() & GnssMeasurement.STATE_TOW_DECODED) == 0) continue;

            RawMeasurement raw = new RawMeasurement();
            raw.svid = m.getSvid();
            raw.constellationType = m.getConstellationType();
            raw.constellation = getConstellationName(raw.constellationType);
            raw.cn0DbHz = m.getCn0DbHz();
            raw.receivedSvTimeNanos = m.getReceivedSvTimeNanos();
            raw.pseudorangeRateMetersPerSecond = m.getPseudorangeRateMetersPerSecond();
            raw.accumulatedDeltaRangeMeters = m.getAccumulatedDeltaRangeMeters();
            raw.accumulatedDeltaRangeState = m.getAccumulatedDeltaRangeState();
            raw.state = m.getState();
            raw.clockTimeNanos = clockTimeNanos;
            raw.fullBiasNanos = fullBiasNanos;
            raw.biasNanos = biasNanos;

            // Compute pseudorange
            double tRxSeconds = (clockTimeNanos - fullBiasNanos - biasNanos) * 1e-9;
            double tTxSeconds = m.getReceivedSvTimeNanos() * 1e-9;

            // GPS week rollover handling
            double tau = tRxSeconds - tTxSeconds;
            if (tau < 0) tau += 604800; // Add one GPS week if negative
            if (tau > 604800) tau -= 604800;

            raw.pseudorangeMeters = tau * SPEED_OF_LIGHT;

            // Only accept reasonable pseudoranges (20,000km to 30,000km)
            if (raw.pseudorangeMeters > 1.9e7 && raw.pseudorangeMeters < 3.1e7) {
                Boolean enabled = enabledConstellations.get(raw.constellation);
                if (enabled != null && enabled) {
                    if (!byConstellation.containsKey(raw.constellation)) {
                        byConstellation.put(raw.constellation, new ArrayList<>());
                    }
                    byConstellation.get(raw.constellation).add(raw);
                }
            }
        }

        // Compute position per constellation
        for (Map.Entry<String, List<RawMeasurement>> entry : byConstellation.entrySet()) {
            String constellation = entry.getKey();
            List<RawMeasurement> constMeasurements = entry.getValue();

            if (constMeasurements.size() >= 4) { // Need at least 4 satellites for 3D fix
                double[] fix = positionSolver.solve(constMeasurements, constellation);
                if (fix != null) {
                    constellationFixes.put(constellation, fix);

                    boolean isPrimary = primaryConstellation.equals("AUTO")
                        || primaryConstellation.equals(constellation);

                    JSObject fixData = new JSObject();
                    fixData.put("constellation", constellation);
                    fixData.put("lat", fix[0]);
                    fixData.put("lon", fix[1]);
                    fixData.put("altitude", fix[2]);
                    fixData.put("accuracy", fix[3]);
                    fixData.put("hdop", fix.length > 4 ? fix[4] : 0);
                    fixData.put("satellitesUsed", constMeasurements.size());
                    fixData.put("isPrimary", isPrimary);

                    notifyListeners("onPositionFix", fixData);
                }
            }
        }

        // Cross-constellation spoofing check
        checkSpoofing();
    }

    /**
     * Process location update from Android's built-in solver
     */
    private void processLocationUpdate(Location location) {
        // Store as the "device" fix for comparison
        constellationFixes.put("DEVICE", new double[]{
            location.getLatitude(),
            location.getLongitude(),
            location.getAltitude(),
            location.getAccuracy()
        });
    }

    /**
     * Compare fixes from different constellations to detect spoofing
     */
    private void checkSpoofing() {
        if (constellationFixes.size() < 2) return;

        double maxDiff = 0;
        String spoofDetail = "";

        String[] constellations = constellationFixes.keySet().toArray(new String[0]);
        for (int i = 0; i < constellations.length; i++) {
            for (int j = i + 1; j < constellations.length; j++) {
                double[] f1 = constellationFixes.get(constellations[i]);
                double[] f2 = constellationFixes.get(constellations[j]);

                double dist = haversine(f1[0], f1[1], f2[0], f2[1]);
                if (dist > maxDiff) {
                    maxDiff = dist;
                    spoofDetail = constellations[i] + " vs " + constellations[j];
                }
            }
        }

        boolean spoofDetected = maxDiff > SPOOFING_THRESHOLD_METERS;

        JSObject alert = new JSObject();
        alert.put("detected", spoofDetected);
        alert.put("diffMeters", maxDiff);
        alert.put("detail", spoofDetail);
        notifyListeners("onSpoofAlert", alert);

        if (spoofDetected) {
            Log.w(TAG, "SPOOFING DETECTED! " + spoofDetail + " diff: " + maxDiff + "m");

            // Auto-switch to non-GPS constellation if GPS is the outlier
            if (primaryConstellation.equals("AUTO") || primaryConstellation.equals("GPS")) {
                autoSwitchConstellation();
            }
        }
    }

    /**
     * When spoofing is detected, automatically switch to the most reliable constellation
     */
    private void autoSwitchConstellation() {
        // Find the constellation whose fix agrees with the most other constellations
        String bestConstellation = null;
        double bestScore = Double.MAX_VALUE;

        for (String c1 : constellationFixes.keySet()) {
            if (c1.equals("DEVICE")) continue; // Skip device fix, it may be spoofed
            double totalDiff = 0;
            int count = 0;
            for (String c2 : constellationFixes.keySet()) {
                if (c2.equals(c1) || c2.equals("DEVICE")) continue;
                double[] f1 = constellationFixes.get(c1);
                double[] f2 = constellationFixes.get(c2);
                totalDiff += haversine(f1[0], f1[1], f2[0], f2[1]);
                count++;
            }
            double avgDiff = count > 0 ? totalDiff / count : Double.MAX_VALUE;
            if (avgDiff < bestScore) {
                bestScore = avgDiff;
                bestConstellation = c1;
            }
        }

        if (bestConstellation != null && !bestConstellation.equals("GPS")) {
            Log.i(TAG, "Auto-switching to " + bestConstellation + " (GPS may be spoofed)");
            // Notify JS to switch primary
            JSObject switchData = new JSObject();
            switchData.put("newPrimary", bestConstellation);
            switchData.put("reason", "GPS spoofing detected, auto-switched to verified constellation");
            notifyListeners("onAutoSwitch", switchData);
        }
    }

    // ======================== UTILITY ========================

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    private String getConstellationName(int type) {
        switch (type) {
            case GnssStatus.CONSTELLATION_GPS: return "GPS";
            case GnssStatus.CONSTELLATION_GLONASS: return "GLONASS";
            case GnssStatus.CONSTELLATION_GALILEO: return "GALILEO";
            case GnssStatus.CONSTELLATION_BEIDOU: return "BEIDOU";
            case GnssStatus.CONSTELLATION_SBAS: return "SBAS";
            case GnssStatus.CONSTELLATION_QZSS: return "QZSS";
            case 7: return "NAVIC"; // CONSTELLATION_IRNSS added in API 29
            default: return "UNKNOWN";
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopGnssListeners();
        super.handleOnDestroy();
    }

    // ======================== DATA CLASSES ========================

    static class SatelliteInfo {
        int svid;
        int constellationType;
        String constellation;
        float cn0DbHz;
        float elevation;
        float azimuth;
        boolean usedInFix;
        boolean hasAlmanac;
        boolean hasEphemeris;
        float carrierFrequencyHz;

        JSObject toJSON() {
            JSObject obj = new JSObject();
            obj.put("svid", svid);
            obj.put("constellation", constellation);
            obj.put("constellationType", constellationType);
            obj.put("snr", cn0DbHz);
            obj.put("elevation", elevation);
            obj.put("azimuth", azimuth);
            obj.put("usedInFix", usedInFix);
            obj.put("hasAlmanac", hasAlmanac);
            obj.put("hasEphemeris", hasEphemeris);
            obj.put("carrierFrequencyHz", carrierFrequencyHz);
            return obj;
        }
    }

    static class RawMeasurement {
        int svid;
        int constellationType;
        String constellation;
        double cn0DbHz;
        long receivedSvTimeNanos;
        double pseudorangeRateMetersPerSecond;
        double accumulatedDeltaRangeMeters;
        int accumulatedDeltaRangeState;
        int state;
        long clockTimeNanos;
        long fullBiasNanos;
        double biasNanos;
        double pseudorangeMeters;
    }
}
