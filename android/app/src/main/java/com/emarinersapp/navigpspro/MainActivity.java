package com.emarinersapp.navigpspro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.emarinersapp.gnss.GnssEnginePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GnssEnginePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
