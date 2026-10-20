package com.corretorkeyboard.keyboard

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
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
 * Fornece:
 * 1. Métodos de injeção e navegação no InputConnection (insertText, deleteBackward, sendEnter).
 * 2. Alternância de teclado e controle de sistema (switchKeyboard, openInputMethodPicker).
 * 3. Status de ativação e seleção para o onboarding (isKeyboardEnabled, isKeyboardSelected).
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

    /** Alterna para o próximo teclado ou exibe o seletor de métodos de entrada */
    @ReactMethod
    fun switchKeyboard(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            val service = CustomKeyboardService.instance
            if (service != null) {
                try {
                    service.switchKeyboard()
                    promise.resolve(true)
                } catch (t: Throwable) {
                    val imm = reactApplicationContext.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                    imm?.showInputMethodPicker()
                    promise.resolve(true)
                }
            } else {
                val imm = reactApplicationContext.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                imm?.showInputMethodPicker()
                promise.resolve(true)
            }
        }
    }

    /** Abre o seletor nativo de teclados do Android */
    @ReactMethod
    fun openInputMethodPicker(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val imm = reactApplicationContext.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                imm?.showInputMethodPicker()
                promise.resolve(true)
            } catch (t: Throwable) {
                promise.reject("E_PICKER", t.message, t)
            }
        }
    }

    /** Abre a tela de configurações de teclado do Android */
    @ReactMethod
    fun openKeyboardSettings(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } catch (t: Throwable) {
                promise.reject("E_SETTINGS", t.message, t)
            }
        }
    }

    /** Verifica se o Teclado do Corretor está ativado em 'Gerenciar Teclados' */
    @ReactMethod
    fun isKeyboardEnabled(promise: Promise) {
        try {
            val imm = reactApplicationContext.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            val enabledMethods = imm?.enabledInputMethodList ?: emptyList()
            val myPackageName = reactApplicationContext.packageName
            val isEnabled = enabledMethods.any { it.packageName == myPackageName }
            promise.resolve(isEnabled)
        } catch (t: Throwable) {
            promise.resolve(false)
        }
    }

    /** Verifica se o Teclado do Corretor é o teclado padrão/selecionado atualmente */
    @ReactMethod
    fun isKeyboardSelected(promise: Promise) {
        try {
            val defaultIme = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.DEFAULT_INPUT_METHOD
            )
            val myPackageName = reactApplicationContext.packageName
            val isSelected = defaultIme != null && defaultIme.contains(myPackageName)
            promise.resolve(isSelected)
        } catch (t: Throwable) {
            promise.resolve(false)
        }
    }

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

