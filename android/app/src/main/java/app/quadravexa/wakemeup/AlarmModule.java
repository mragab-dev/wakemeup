package app.quadravexa.wakemeup;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class AlarmModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AlarmModule";

    public AlarmModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AlarmModule";
    }

    @ReactMethod
    public void scheduleAlarm(String alarmId, String alarmName, String challengeType, String ringtoneUri, String type, double timestamp) {
        Context context = getReactApplicationContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("alarmId", alarmId);
        intent.putExtra("alarmName", alarmName);
        intent.putExtra("challengeType", challengeType);
        intent.putExtra("ringtoneUri", ringtoneUri);
        intent.putExtra("type", type);

        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long triggerAtMillis = (long) timestamp;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
        }

        Log.d(TAG, "Scheduled alarm " + alarmId + " for " + triggerAtMillis);
    }

    @ReactMethod
    public void cancelAlarm(String alarmId) {
        Context context = getReactApplicationContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        alarmManager.cancel(pendingIntent);
        Log.d(TAG, "Cancelled alarm " + alarmId);
    }

    @ReactMethod
    public void stopAlarmService() {
        Context context = getReactApplicationContext();
        if (context == null) return;
        
        Log.d(TAG, "stopAlarmService called from JS");
        Intent intent = new Intent(context, AlarmService.class);
        intent.setAction("STOP_ALARM");
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    @ReactMethod
    public void isIgnoringBatteryOptimizations(Promise promise) {
        if (getReactApplicationContext() == null) {
            promise.resolve(true); // Default to true if context not ready
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String packageName = getReactApplicationContext().getPackageName();
            PowerManager pm = (PowerManager) getReactApplicationContext().getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                promise.resolve(pm.isIgnoringBatteryOptimizations(packageName));
            } else {
                promise.resolve(true);
            }
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        if (getReactApplicationContext() == null) {
            promise.resolve(true);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void requestOverlayPermission() {
        if (getReactApplicationContext() == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String packageName = getReactApplicationContext().getPackageName();
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + packageName));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getReactApplicationContext().startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start overlay permission settings", e);
            }
        }
    }

    @ReactMethod
    public void canScheduleExactAlarms(Promise promise) {
        if (getReactApplicationContext() == null) {
            promise.resolve(true);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getReactApplicationContext().getSystemService(Context.ALARM_SERVICE);
            promise.resolve(alarmManager.canScheduleExactAlarms());
        } else {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void requestIgnoreBatteryOptimizations() {
        if (getReactApplicationContext() == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String packageName = getReactApplicationContext().getPackageName();
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + packageName));
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getReactApplicationContext().startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start battery optimization settings", e);
            }
        }
    }

    @ReactMethod
    public void requestExactAlarmPermission() {
        if (getReactApplicationContext() == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getReactApplicationContext().startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start exact alarm permission settings", e);
            }
        }
    }

    @ReactMethod
    public void isDeviceLocked(Promise promise) {
        Context context = getReactApplicationContext();
        if (context == null) {
            promise.resolve(false);
            return;
        }
        android.app.KeyguardManager km = (android.app.KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
        if (km != null) {
            promise.resolve(km.isKeyguardLocked());
        } else {
            promise.resolve(false);
        }
    }
}
