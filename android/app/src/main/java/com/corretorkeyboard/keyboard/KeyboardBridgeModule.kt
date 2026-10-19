package com.corretorkeyboard.keyboard

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * KeyboardBridgeModule
 * ---------------------------------------------------------------------------
 * NativeModule exposto ao JS como `NativeModules.KeyboardBridge`.
 *
 * Fluxo de injeção de texto:
 *   JS (CorretorKeyboard.tsx) → KeyboardBridge.insertText("...")
 *     → [thread do NativeModules] → runOnUiThread
 *       → CustomKeyboardService.commitText()
 *         → InputConnection.commitText()  ──IPC──►  EditText do WhatsApp
 *
 * Por que runOnUiThread? InputConnection não é thread-safe e o
 * InputMethodService espera ser manipulado na Main Thread.
 */
class KeyboardBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "KeyboardBridge"

    private inline fun withService(promise: Promise, crossinline block: (CustomKeyboardService) -> Any?) {
        UiThreadUtil.runOnUiThread {
            val service = CustomKeyboardService.instance
            if (service == null) {
                promise.reject("E_IME_INACTIVE", "O teclado do corretor não está ativo.")
                return@runOnUiThread
            }
            try {
                promise.resolve(block(service))
            } catch (t: Throwable) {
                promise.reject("E_IME_FAILURE", t.message, t)
            }
        }
    }

    /** Injeta texto/link formatado no campo ativo. */
    @ReactMethod
    fun insertText(text: String, promise: Promise) =
        withService(promise) { it.commitText(text) }

    @ReactMethod
    fun deleteBackward(promise: Promise) =
        withService(promise) { it.deleteBackward() }

    @ReactMethod
    fun sendEnter(promise: Promise) =
        withService(promise) { it.sendEnter() }

    @ReactMethod
    fun switchKeyboard(promise: Promise) =
        withService(promise) { it.switchKeyboard(); true }

    /** Retorna o package do app em foco (ex.: "com.whatsapp"). */
    @ReactMethod
    fun getTargetApp(promise: Promise) =
        withService(promise) { it.targetPackage }

    @ReactMethod
    fun isKeyboardContext(promise: Promise) {
        promise.resolve(CustomKeyboardService.instance != null)
    }

    // Obrigatórios para NativeEventEmitter no RN ≥ 0.65
    @ReactMethod fun addListener(eventName: String) { /* no-op */ }
    @ReactMethod fun removeListeners(count: Double) { /* no-op */ }
}
