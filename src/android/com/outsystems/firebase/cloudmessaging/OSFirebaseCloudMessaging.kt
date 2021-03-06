package com.outsystems.firebase.cloudmessaging;

import android.content.Intent
import android.content.Context
import com.outsystems.plugins.firebasemessaging.controller.*
import com.outsystems.plugins.firebasemessaging.model.FirebaseMessagingError
import com.outsystems.plugins.firebasemessaging.model.database.DatabaseManager
import com.outsystems.plugins.firebasemessaging.model.database.DatabaseManagerInterface
import com.outsystems.plugins.oscordova.CordovaImplementation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers.Default
import kotlinx.coroutines.launch
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaInterface
import org.apache.cordova.CordovaWebView
import org.json.JSONArray

class OSFirebaseCloudMessaging : CordovaImplementation() {

    private lateinit var notificationManager : FirebaseNotificationManagerInterface
    private lateinit var messagingManager : FirebaseMessagingManagerInterface
    private lateinit var controller : FirebaseMessagingController
    private lateinit var databaseManager: DatabaseManagerInterface

    private var deviceReady: Boolean = false
    private val eventQueue: MutableList<String> = mutableListOf()

    companion object {
        private const val CHANNEL_NAME_KEY = "notification_channel_name"
        private const val CHANNEL_DESCRIPTION_KEY = "notification_channel_description"
        private const val ERROR_FORMAT_PREFIX = "OS-PLUG-FCMS-"
    }

    override fun initialize(cordova: CordovaInterface, webView: CordovaWebView) {
        super.initialize(cordova, webView)
        databaseManager = DatabaseManager.getInstance(getActivity())
        notificationManager = FirebaseNotificationManager(getActivity(), databaseManager)
        messagingManager = FirebaseMessagingManager()
        controller = FirebaseMessagingController(controllerDelegate, messagingManager, notificationManager)

        setupChannelNameAndDescription()

        val intent = getActivity().intent
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        val extras = intent.extras
        val extrasSize = extras?.size() ?: 0
        if(extrasSize > 0) {
            FirebaseMessagingOnClickActivity.notifyClickNotification(intent)
        }
    }

    private val controllerDelegate = object: FirebaseMessagingInterface {
        override fun callback(result: String, callbackId: String) {
            sendPluginResult(result, callbackId = callbackId)
        }
        override fun callbackNotifyApp(event: String, result: String) {
            val js = "cordova.plugins.OSFirebaseCloudMessaging.fireEvent(" +
                    "\"" + event + "\"," + result + ");"
            if(deviceReady) {
                triggerEvent(js)
            }
            else {
                eventQueue.add(js)
            }
        }
        override fun callbackSuccess(callbackId: String) {
            sendPluginResult(true, callbackId = callbackId)
        }
        override fun callbackBadgeNumber(number: Int, callbackId: String) {
            //Does nothing on android
        }
        override fun callbackError(error: FirebaseMessagingError, callbackId: String) {
            sendPluginResult(null, Pair(formatErrorCode(error.code), error.description), callbackId)
        }
    }

    private fun ready() {
        deviceReady = true
        eventQueue.forEach { event ->
            triggerEvent(event)
        }
        eventQueue.clear()
    }

    override fun execute(action: String, args: JSONArray, callbackContext: CallbackContext): Boolean {
        super.execute(action, args, callbackContext)
        val callbackId = callbackContext.callbackId
        CoroutineScope(Default).launch {
            when (action) {
                "ready" -> {
                    ready()
                }
                "getToken" -> {
                    controller.getToken(callbackId)
                }
                "subscribe" -> {
                    args.getString(0)?.let { topic ->
                        controller.subscribe(topic, callbackId)
                    }
                }
                "unsubscribe" -> {
                    args.getString(0)?.let { topic ->
                        controller.unsubscribe(topic, callbackId)
                    }
                }
                "registerDevice" -> {
                    controller.registerDevice(callbackId)
                }
                "unregisterDevice" -> {
                    controller.unregisterDevice(callbackId)
                }
                "clearNotifications" -> {
                    clearNotifications(callbackId)
                }
                "sendLocalNotification" -> {
                    sendLocalNotification(args, callbackId)
                }
                "setBadge" -> {
                    setBadgeNumber(callbackId)
                }
                "getBadge" -> {
                    getBadgeNumber(callbackId)
                }
                "getPendingNotifications" -> {
                    args.getBoolean(0).let { clearFromDatabase ->
                        controller.getPendingNotifications(clearFromDatabase, callbackId)
                    }
                }
                else -> {}
            }
        }
        return true
    }

    override fun onRequestPermissionResult(requestCode: Int,
                                           permissions: Array<String>,
                                           grantResults: IntArray) {
        // Does nothing. These permissions are not required on Android.
    }

    override fun areGooglePlayServicesAvailable(): Boolean {
        // Not used in this project.
        return false
    }

    private fun getBadgeNumber(callbackId: String) {
        controller.getBadgeNumber(callbackId)
    }

    private fun sendLocalNotification(args : JSONArray, callbackId: String) {
        val badge = args.get(0).toString().toInt()
        val title = args.get(1).toString()
        val text = args.get(2).toString()
        val channelName = args.get(3).toString()
        val channelDescription = args.get(4).toString()
        controller.sendLocalNotification(badge, title, text, null, channelName, channelDescription, callbackId)
    }

    private fun clearNotifications(callbackId: String) {
        controller.clearNotifications(callbackId)
    }

    private fun setBadgeNumber(callbackId: String) {
        controller.setBadgeNumber(callbackId)
    }

    private fun setupChannelNameAndDescription(){
        val channelName = getActivity().getString(getStringResourceId("notification_channel_name"))
        val channelDescription = getActivity().getString(getStringResourceId("notification_channel_description"))

        if(!channelName.isNullOrEmpty()){
            val editorName = getActivity().getSharedPreferences(CHANNEL_NAME_KEY, Context.MODE_PRIVATE).edit()
            editorName.putString(CHANNEL_NAME_KEY, channelName)
            editorName.apply()
        }
        if(!channelDescription.isNullOrEmpty()){
            val editorDescription = getActivity().getSharedPreferences(CHANNEL_DESCRIPTION_KEY, Context.MODE_PRIVATE).edit()
            editorDescription.putString(CHANNEL_DESCRIPTION_KEY, channelDescription)
            editorDescription.apply()
        }
    }

    private fun getStringResourceId(typeAndName: String): Int {
        return getActivity().resources.getIdentifier(typeAndName, "string", getActivity().packageName)
    }

    private fun formatErrorCode(code: Int): String {
        return ERROR_FORMAT_PREFIX + code.toString().padStart(4, '0')
    }

}