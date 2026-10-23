package com.corretorkeyboard.keyboard

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import java.util.concurrent.Executors

/**
 * KeyboardBridgeModule
 * ---------------------------------------------------------------------------
 * NativeModule exposto ao JS como `NativeModules.KeyboardBridge`.
 *
 * Fornece:
 * 1. Métodos de injeção e navegação no InputConnection (insertText, deleteBackward, sendEnter).
 * 2. Alternância de teclado e controle de sistema (switchKeyboard, openInputMethodPicker).
 * 3. Status de ativação e seleção para o onboarding (isKeyboardEnabled, isKeyboardSelected).
 * 4. Envio de arquivos: foto direto na conversa (commitImage) e compartilhamento
 *    de áudio, vídeo e várias fotos (shareMedia).
 */
class KeyboardBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "KeyboardBridge"

    /** Downloads fora da main thread, um por vez. */
    private val downloads = Executors.newSingleThreadExecutor()

    private inline fun withService(promise: Promise, crossinline block: (CustomKeyboardService) -> Any?) {
        UiThreadUtil.runOnUiThread {
            val service = CustomKeyboardService.instance
            if (service == null) {
                promise.reject("E_IME_INACTIVE", "O teclado KEYCON não está ativo.")
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

    /** { before: texto antes do cursor, inputType: tipo do campo (EditorInfo) } */
    @ReactMethod
    fun getInputContext(promise: Promise) =
        withService(promise) { it.inputContext() }

    /** Troca a palavra atual pela sugestão escolhida (apaga `count` e insere `text`). */
    @ReactMethod
    fun replaceTextBeforeCursor(count: Double, text: String, promise: Promise) =
        withService(promise) { it.replaceTextBeforeCursor(count.toInt(), text) }

    /** Alterna para o próximo teclado ou exibe o seletor de métodos de entrada */
    /** Teclado em tela grande (CRM) ou de volta ao tamanho normal. */
    @ReactMethod
    fun setExpanded(expanded: Boolean, promise: Promise) =
        withService(promise) { it.setExpanded(expanded) }

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

    /** Abre o app KEYCON (usado pelo teclado quando não há login). */
    @ReactMethod
    fun openApp(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val ctx = reactApplicationContext
                val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
                    ?: return@runOnUiThread promise.reject("E_OPEN_APP", "App não encontrado.")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                ctx.startActivity(intent)
                promise.resolve(true)
            } catch (t: Throwable) {
                promise.reject("E_OPEN_APP", t.message, t)
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

    /** Verifica se o KEYCON está ativado em 'Gerenciar Teclados' */
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

    /** Verifica se o KEYCON é o teclado padrão/selecionado atualmente */
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

    /** O JS avisa que a tela do teclado montou (usado no diagnóstico de carregamento). */
    @ReactMethod
    fun notifyReady() {
        UiThreadUtil.runOnUiThread { CustomKeyboardService.instance?.markJsReady() }
    }

    /** O JS reporta erros não tratados para aparecerem no diagnóstico do teclado. */
    @ReactMethod
    fun reportError(message: String) {
        CustomKeyboardService.lastJsError = message
        android.util.Log.e("KeyboardBridge", "Erro JS: $message")
    }

    // -----------------------------------------------------------------------
    // Envio de arquivos (fotos, vídeos e áudios)
    // -----------------------------------------------------------------------

    /** Formatos de arquivo que o campo em foco aceita (tela de Diagnóstico). */
    @ReactMethod
    fun getContentMimeTypes(promise: Promise) =
        withService(promise) { Arguments.fromArray(it.acceptedContentMimeTypes()) }

    /**
     * Baixa a imagem e entrega direto na conversa.
     * Resolve "sent", "unsupported" (o campo não aceita esse formato) ou "failed".
     */
    @ReactMethod
    fun commitImage(url: String, description: String, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            val service = CustomKeyboardService.instance
                ?: return@runOnUiThread promise.reject("E_IME_INACTIVE", "O teclado KEYCON não está ativo.")
            // Nem baixa se o campo não aceita nenhuma imagem
            if (!MediaFiles.acceptsAny(service.acceptedContentMimeTypes(), "image/")) {
                return@runOnUiThread promise.resolve("unsupported")
            }
            downloads.execute {
                val media = try {
                    MediaFiles.download(reactApplicationContext, url)
                } catch (t: Throwable) {
                    promise.reject("E_DOWNLOAD", t.message ?: "Não foi possível baixar a foto.", t)
                    return@execute
                }
                UiThreadUtil.runOnUiThread {
                    val current = CustomKeyboardService.instance
                    when {
                        current == null ->
                            promise.reject("E_IME_INACTIVE", "O teclado foi fechado antes do envio.")
                        !media.mimeType.startsWith("image/") ->
                            promise.reject("E_NOT_IMAGE", "O link não é de uma imagem (${media.mimeType}).")
                        !MediaFiles.accepts(current.acceptedContentMimeTypes(), media.mimeType) ->
                            promise.resolve("unsupported")
                        else -> try {
                            promise.resolve(if (current.commitImage(media, description, url)) "sent" else "failed")
                        } catch (t: Throwable) {
                            promise.reject("E_COMMIT", t.message, t)
                        }
                    }
                }
            }
        }
    }

    /**
     * Baixa os arquivos e abre o compartilhamento do Android, priorizando o app
     * em foco (ex.: WhatsApp). Resolve "direct" ou "chooser".
     */
    @ReactMethod
    fun shareMedia(urls: ReadableArray, promise: Promise) {
        val list = (0 until urls.size()).mapNotNull { urls.getString(it) }
        if (list.isEmpty()) {
            promise.reject("E_EMPTY", "Nenhum arquivo para enviar.")
            return
        }
        downloads.execute {
            val files = try {
                list.map { MediaFiles.download(reactApplicationContext, it) }
            } catch (t: Throwable) {
                promise.reject("E_DOWNLOAD", t.message ?: "Não foi possível baixar o arquivo.", t)
                return@execute
            }
            UiThreadUtil.runOnUiThread {
                try {
                    val service = CustomKeyboardService.instance
                    val context = service ?: reactApplicationContext
                    promise.resolve(MediaFiles.share(context, files, service?.targetPackage))
                } catch (t: Throwable) {
                    promise.reject("E_SHARE", t.message ?: "Não foi possível abrir o compartilhamento.", t)
                }
            }
        }
    }

    // Obrigatórios para NativeEventEmitter no RN ≥ 0.65
    @ReactMethod fun addListener(eventName: String) { /* no-op */ }
    @ReactMethod fun removeListeners(count: Double) { /* no-op */ }
}

