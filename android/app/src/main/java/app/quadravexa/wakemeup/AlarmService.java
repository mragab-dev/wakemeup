package com.quadravexa.wakemeup;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.io.IOException;

public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "ALARM_SERVICE_CHANNEL";
    private static MediaPlayer mediaPlayer;
    private static Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AlarmService created");

        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "WakeMeUp:AlarmWakeLock");
        wakeLock.acquire(10 * 60 * 1000L);

        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            Log.d(TAG, "AlarmService started with null intent, stopping.");
            stopSelf();
            return START_NOT_STICKY;
        }

        if ("STOP_ALARM".equals(intent.getAction())) {
            Log.d(TAG, "Received STOP_ALARM action");
            stopAlarm();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if ("RESCHEDULE_ALARMS".equals(intent.getAction())) {
            Log.d(TAG, "Handling RESCHEDULE_ALARMS action");
            
            // Show a temporary silent notification for background rescheduling
            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("WakeMeUp")
                    .setContentText("Rescheduling alarms in background...")
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setCategory(NotificationCompat.CATEGORY_SERVICE)
                    .build();
            
            startForeground(2, notification);
            
            // We give the app 15 seconds to rehydrate store and reschedule
            // before stopping the foreground service automatically.
            new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "Background rescheduling finished, stopping service.");
                    stopForeground(true);
                    stopSelf();
                }
            }, 15000);
            
            return START_NOT_STICKY;
        }

        Log.d(TAG, "AlarmService started for ringing with action: " + intent.getAction());

        String alarmName = intent.getStringExtra("alarmName");
        if (alarmName == null) alarmName = "Alarm";

        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // Add extra to tell JS to open challenge screen
        notificationIntent.putExtra("openChallenge", true);
        notificationIntent.putExtra("alarmId", intent.getStringExtra("alarmId"));
        notificationIntent.putExtra("challengeType", intent.getStringExtra("challengeType") != null ? intent.getStringExtra("challengeType") : "none");
        notificationIntent.putExtra("type", intent.getStringExtra("type") != null ? intent.getStringExtra("type") : "alarm");

        int requestCode = 0;
        try {
            String idStr = intent.getStringExtra("alarmId");
            if (idStr != null) {
                // Strip suffix if any for consistent request code
                requestCode = idStr.split("_")[0].hashCode();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error generating requestCode", e);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(this, requestCode, notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("🚨 " + alarmName)
                .setContentText("Time to wake up!")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentIntent(pendingIntent)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(pendingIntent, true)
                .setOngoing(true)
                .build();

        startForeground(1, notification);

        playAlarmSound(intent.getStringExtra("ringtoneUri"));
        startVibration();
        
        // Try to start activity directly to open challenge screen immediately
        Intent activityIntent = new Intent(this, MainActivity.class);
        activityIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        activityIntent.putExtras(notificationIntent.getExtras());
        
        Log.d(TAG, "Starting MainActivity for alarmId: " + intent.getStringExtra("alarmId"));
        startActivity(activityIntent);

        return START_NOT_STICKY;
    }

    private void playAlarmSound(String ringtoneUriString) {
        if (mediaPlayer != null) {
            mediaPlayer.release();
        }
        
        try {
            // Set volume to maximum for alarms
            android.media.AudioManager audioManager = (android.media.AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(android.media.AudioManager.STREAM_ALARM);
                audioManager.setStreamVolume(android.media.AudioManager.STREAM_ALARM, maxVolume, 0);
                Log.d(TAG, "Set STREAM_ALARM volume to max: " + maxVolume);
            }

            Uri alarmUri = null;
            if (ringtoneUriString != null && !ringtoneUriString.isEmpty() && !ringtoneUriString.equals("default")) {
                String soundName = ringtoneUriString;
                if (soundName.contains(".")) {
                    soundName = soundName.substring(0, soundName.lastIndexOf('.'));
                }
                int resId = getResources().getIdentifier(soundName, "raw", getPackageName());
                if (resId != 0) {
                    alarmUri = Uri.parse("android.resource://" + getPackageName() + "/" + resId);
                    Log.d(TAG, "Playing custom alarm sound: " + soundName + " (resId: " + resId + ")");
                } else {
                    Log.w(TAG, "Custom alarm sound not found: " + soundName + ". Falling back to default.");
                }
            }

            if (alarmUri == null) {
                alarmUri = android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI;
                Log.d(TAG, "Playing default alarm sound");
            }

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(this, alarmUri);
            
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (IOException e) {
            Log.e(TAG, "Failed to play alarm sound", e);
            // Try one last time with default if custom failed
            if (ringtoneUriString != null && !ringtoneUriString.equals("default")) {
                playAlarmSound("default");
            }
        }
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 500}, 0));
            } else {
                vibrator.vibrate(new long[]{0, 500, 500}, 0);
            }
        }
    }

    private void stopAlarm() {
        Log.d(TAG, "Stopping alarm sound and vibration");
        
        // Stop and release MediaPlayer
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                    Log.d(TAG, "MediaPlayer stopped");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error stopping MediaPlayer", e);
            } finally {
                try {
                    mediaPlayer.reset();
                    mediaPlayer.release();
                    Log.d(TAG, "MediaPlayer released");
                } catch (Exception e) {
                    Log.e(TAG, "Error releasing MediaPlayer", e);
                }
                mediaPlayer = null;
            }
        }

        // Stop Vibrator
        if (vibrator != null) {
            try {
                vibrator.cancel();
                Log.d(TAG, "Vibrator cancelled");
            } catch (Exception e) {
                Log.e(TAG, "Error cancelling Vibrator", e);
            } finally {
                vibrator = null;
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alarm Service Channel",
                    NotificationManager.IMPORTANCE_HIGH
            );
            serviceChannel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "AlarmService onDestroy called");
        // We only stop the alarm here if it's a "natural" death (stopSelf or STOP_ALARM action)
        // If it was killed by system/user swipe, we rely on onTaskRemoved or STICKY restart.
        stopAlarm();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "Task removed (app swiped away)");
        // Don't stop the alarm sound! Keep it ringing.
        // On some devices, we might need to recreate the notification to stay in foreground.
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
