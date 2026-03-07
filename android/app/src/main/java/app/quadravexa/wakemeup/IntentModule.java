package app.quadravexa.wakemeup;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

public class IntentModule extends ReactContextBaseJavaModule {
    public IntentModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "IntentModule";
    }

    @ReactMethod
    public void getIntentExtras(Promise promise) {
        if (getCurrentActivity() == null) {
            promise.resolve(null);
            return;
        }
        Intent intent = getCurrentActivity().getIntent();
        if (intent == null) {
            promise.resolve(null);
            return;
        }
        Bundle extras = intent.getExtras();
        if (extras != null) {
            WritableMap map = Arguments.createMap();
            for (String key : extras.keySet()) {
                Object value = extras.get(key);
                if (value instanceof String) {
                    map.putString(key, (String) value);
                } else if (value instanceof Boolean) {
                    map.putBoolean(key, (Boolean) value);
                } else if (value instanceof Integer) {
                    map.putInt(key, (Integer) value);
                } else if (value instanceof Double) {
                    map.putDouble(key, (Double) value);
                }
            }
            promise.resolve(map);
        } else {
            promise.resolve(null);
        }
    }
}
