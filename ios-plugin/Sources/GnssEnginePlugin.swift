import Foundation
import Capacitor
import CoreLocation

/**
 * GnssEnginePlugin (iOS) — Native GPS via CLLocationManager
 *
 * iOS does NOT expose raw GNSS measurements (pseudoranges, satellite data).
 * This plugin provides:
 * 1. High-accuracy GPS position via CLLocationManager
 * 2. Background location tracking for maritime use
 * 3. Speed and heading from GPS
 * 4. Position accuracy metrics
 *
 * Satellite-level features (constellation selection, spoofing detection)
 * are NOT available on iOS — Apple restricts this at the OS level.
 * The JS layer gracefully handles this with appropriate UI messaging.
 */
@objc(GnssEnginePlugin)
public class GnssEnginePlugin: CAPPlugin, CLLocationManagerDelegate {

    private var locationManager: CLLocationManager?
    private var isTracking = false
    private var backgroundMode = false

    override public func load() {
        locationManager = CLLocationManager()
        locationManager?.delegate = self
        locationManager?.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager?.distanceFilter = kCLDistanceFilterNone
        locationManager?.allowsBackgroundLocationUpdates = true
        locationManager?.pausesLocationUpdatesAutomatically = false
        locationManager?.activityType = .otherNavigation

        // For maritime use: show location indicator
        if #available(iOS 14.0, *) {
            locationManager?.showsBackgroundLocationIndicator = true
        }
    }

    // MARK: - Plugin Methods

    @objc func startMeasurements(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            let status = CLLocationManager.authorizationStatus()
            if status == .notDetermined {
                self.locationManager?.requestAlwaysAuthorization()
            } else if status == .denied || status == .restricted {
                call.reject("Location permission denied. Enable in Settings > Privacy > Location Services")
                return
            }

            self.locationManager?.startUpdatingLocation()
            self.locationManager?.startUpdatingHeading()
            self.isTracking = true

            call.resolve([
                "started": true,
                "platform": "ios",
                "note": "iOS provides GPS position only. Satellite-level data (constellation selection, raw measurements) is not available on iOS."
            ])
        }
    }

    @objc func stopMeasurements(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.locationManager?.stopUpdatingLocation()
            self?.locationManager?.stopUpdatingHeading()
            self?.isTracking = false
            call.resolve(["stopped": true])
        }
    }

    @objc func setConstellations(_ call: CAPPluginCall) {
        // iOS does not support constellation selection
        call.resolve([
            "supported": false,
            "message": "iOS uses all available GNSS constellations automatically. Individual constellation selection is not supported by Apple."
        ])
    }

    @objc func setPrimary(_ call: CAPPluginCall) {
        // iOS does not support primary constellation selection
        call.resolve([
            "supported": false,
            "message": "iOS automatically selects the best satellites from all constellations."
        ])
    }

    @objc func getSatellites(_ call: CAPPluginCall) {
        // iOS does not expose satellite data
        call.resolve([
            "satellites": [],
            "count": 0,
            "supported": false,
            "message": "iOS does not provide individual satellite data."
        ])
    }

    @objc func getConstellationFixes(_ call: CAPPluginCall) {
        // iOS computes a single fused fix
        if let location = locationManager?.location {
            call.resolve([
                "FUSED": [
                    "lat": location.coordinate.latitude,
                    "lon": location.coordinate.longitude,
                    "accuracy": location.horizontalAccuracy
                ],
                "note": "iOS provides a single fused position from all available satellites."
            ])
        } else {
            call.resolve(["note": "No location available yet"])
        }
    }

    // MARK: - CLLocationManagerDelegate

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        var data: [String: Any] = [
            "lat": location.coordinate.latitude,
            "lon": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "verticalAccuracy": location.verticalAccuracy,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000,
            "constellation": "FUSED",
            "isPrimary": true,
            "satellitesUsed": 0,
            "hdop": max(1.0, location.horizontalAccuracy / 6.0) // Estimate HDOP from accuracy
        ]

        if location.speed >= 0 {
            data["speedKnots"] = location.speed * 1.94384 // m/s to knots
        }
        if location.course >= 0 {
            data["course"] = location.course
        }

        // Notify position update
        notifyListeners("onPositionFix", data)

        // No spoofing detection possible on iOS
        notifyListeners("onSpoofAlert", [
            "detected": false,
            "diffMeters": 0,
            "detail": "Spoofing detection not available on iOS"
        ])
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        if newHeading.headingAccuracy < 0 { return }

        notifyListeners("onHeadingUpdate", [
            "trueHeading": newHeading.trueHeading,
            "magneticHeading": newHeading.magneticHeading,
            "accuracy": newHeading.headingAccuracy
        ])
    }

    public func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            if isTracking {
                locationManager?.startUpdatingLocation()
                locationManager?.startUpdatingHeading()
            }
        case .denied, .restricted:
            notifyListeners("onPermissionDenied", [
                "message": "Location permission denied"
            ])
        default:
            break
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        notifyListeners("onError", [
            "message": error.localizedDescription,
            "code": (error as NSError).code
        ])
    }
}
