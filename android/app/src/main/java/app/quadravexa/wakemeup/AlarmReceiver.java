package app.quadravexa.wakemeup;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Alarm received!");

        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("alarmId", intent.getStringExtra("alarmId"));
        serviceIntent.putExtra("alarmName", intent.getStringExtra("alarmName"));
        serviceIntent.putExtra("challengeType", intent.getStringExtra("challengeType"));
        serviceIntent.putExtra("ringtoneUri", intent.getStringExtra("ringtoneUri"));
        serviceIntent.putExtra("type", intent.getStringExtra("type"));

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }
}
