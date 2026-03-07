package app.quadravexa.wakemeup
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    
    super.onCreate(null)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        val keyguardManager = getSystemService(android.content.Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
        keyguardManager.requestDismissKeyguard(this, null)
    } else {
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )
    }
  }

  override fun onResume() {
    super.onResume()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
        val keyguardManager = getSystemService(android.content.Context.KEYGUARD_SERVICE) as android.app.KeyguardManager
        keyguardManager.requestDismissKeyguard(this, null)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    
    // Emit intent to JS for foreground handling
    val extras = intent.extras
    if (extras != null) {
        val map = Arguments.createMap()
        for (key in extras.keySet()) {
            val value = extras.get(key)
            if (value is String) {
                map.putString(key, value)
            } else if (value is Boolean) {
                map.putBoolean(key, value)
            } else if (value is Int) {
                map.putInt(key, value)
            } else if (value is Double) {
                map.putDouble(key, value)
            }
        }
        
        reactInstanceManager.currentReactContext?.let { context ->
            if (context.hasActiveCatalystInstance()) {
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNewIntent", map)
            }
        }
    }
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
