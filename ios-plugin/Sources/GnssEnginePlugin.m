#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Register the plugin with Capacitor
CAP_PLUGIN(GnssEnginePlugin, "GnssEngine",
    CAP_PLUGIN_METHOD(startMeasurements, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopMeasurements, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setConstellations, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setPrimary, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getSatellites, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getConstellationFixes, CAPPluginReturnPromise);
)
