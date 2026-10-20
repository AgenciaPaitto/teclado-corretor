package com.corretorkeyboard.keyboard

import android.content.res.Configuration
import android.inputmethodservice.InputMethodService
import android.os.Build
import android.os.Bundle
import android.text.TextUtils
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.view.ContextThemeWrapper
import android.widget.FrameLayout
import com.corretorkeyboard.R
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference

/**
 * CustomKeyboardService
 * ---------------------------------------------------------------------------
 * Ponto de entrada do TECLADO no Android. O sistema cria esta classe quando o
 * usuário seleciona "Teclado do Corretor" e um campo de texto recebe foco em
 * QUALQUER app (ex.: WhatsApp).
 *
 * Arquitetura da ponte:
 *
 *   ┌──────────── WhatsApp (outro processo) ────────────┐
 *   │  EditText  ◄──── InputConnection (Binder IPC) ────┼──┐
 *   └───────────────────────────────────────────────────┘  │
 *                                                          │
 *   ┌──────────── Nosso processo ──────────────────────────┼──┐
 *   │ CustomKeyboardService (InputMethodService)  ─────────┘  │
 *   │    └─ onCreateInputView() → ReactRootView               │
 *   │          └─ JS: AppRegistry "CorretorKeyboard"          │
 *   │ KeyboardBridgeModule (NativeModule) ──► service.commit  │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Reaproveitamos o MESMO ReactInstanceManager do MainApplication: o JS bundle
 * é carregado uma única vez e app + teclado compartilham MMKV/estado.
 *
 * NOTA (New Architecture / Bridgeless, RN ≥ 0.74 com newArchEnabled=true):
 * substitua ReactRootView por `reactHost.createSurface(this, MODULE_NAME, props)`
 * e use `surface.view`. O resto do ciclo de vida permanece igual.
 */
class CustomKeyboardService : InputMethodService() {

    companion object {
        /** Nome registrado via AppRegistry.registerComponent no index.js */
        const val MODULE_NAME = "CorretorKeyboard"

        /** Altura total do teclado (toolbar + conteúdo + barra inferior) em pé. */
        private const val KEYBOARD_HEIGHT_DP = 320

        /**
         * Celular deitado: a tela tem ~360-410dp de altura, então 320dp cobriria
         * quase tudo. Usamos no máximo metade da altura, com um piso legível.
         */
        private const val LANDSCAPE_SCREEN_FRACTION = 0.5f
        private const val MIN_LANDSCAPE_HEIGHT_DP = 180

        // Eventos emitidos ao JS
        const val EVENT_KEYBOARD_SHOW = "onKeyboardShow"
        const val EVENT_KEYBOARD_HIDE = "onKeyboardHide"

        /**
         * Referência fraca para que o NativeModule encontre o serviço ativo
         * sem causar memory leak quando o sistema destruir o IME.
         */
        @Volatile
        private var instanceRef: WeakReference<CustomKeyboardService>? = null
        val instance: CustomKeyboardService? get() = instanceRef?.get()
    }

    private var rootContainer: KeyboardRootFrameLayout? = null
    private var reactRootView: ReactRootView? = null

    /** Pacote do app em foco (ex.: "com.whatsapp"). */
    var targetPackage: String? = null
        private set

    private val reactInstanceManager: ReactInstanceManager
        get() = (application as ReactApplication).reactNativeHost.reactInstanceManager

    /**
     * Container raiz do teclado com medição determinística de altura.
     * O Android InputMethodService injeta a view dentro de um container com WRAP_CONTENT.
     * Sem forçar MeasureSpec.EXACTLY no onMeasure, a ReactRootView (que ainda não tem filhos nativos
     * antes do JS carregar) colapsaria para 0 pixels de altura, tornando o teclado invisível.
     */
    private class KeyboardRootFrameLayout(
        context: android.content.Context,
        initialHeightPx: Int
    ) : FrameLayout(context) {
        /** Pode mudar ao girar o celular; o filho (ReactRootView) acompanha via MATCH_PARENT. */
        var targetHeightPx: Int = initialHeightPx
            set(value) {
                if (field == value) return
                field = value
                minimumHeight = value
                layoutParams?.let { it.height = value; layoutParams = it }
                requestLayout()
            }

        override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
            val forcedHeightSpec = MeasureSpec.makeMeasureSpec(targetHeightPx, MeasureSpec.EXACTLY)
            super.onMeasure(widthMeasureSpec, forcedHeightSpec)
            setMeasuredDimension(MeasureSpec.getSize(widthMeasureSpec), targetHeightPx)
        }
    }

    // -----------------------------------------------------------------------
    // Ciclo de vida do IME
    // -----------------------------------------------------------------------

    override fun onCreate() {
        super.onCreate()
        instanceRef = WeakReference(this)
    }

    /**
     * Força o sistema Android a SEMPRE exibir a visualização do teclado quando solicitado.
     */
    override fun onEvaluateInputViewShown(): Boolean = true

    /** Nunca usar modo "fullscreen" (landscape) — quebraria o layout RN. */
    override fun onEvaluateFullscreenMode(): Boolean = false

    /**
     * Chamado para criar ou obter a View do teclado.
     */
    override fun onCreateInputView(): View {
        // O sistema chama de novo ao girar a tela: reaproveita a view e só ajusta a altura
        rootContainer?.let { container ->
            (container.parent as? ViewGroup)?.removeView(container)
            container.targetHeightPx = keyboardHeightPx()
            return container
        }

        val themedContext = ContextThemeWrapper(this, R.style.AppTheme)
        val heightPx = keyboardHeightPx()

        val container = KeyboardRootFrameLayout(themedContext, heightPx).apply {
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, heightPx)
            minimumHeight = heightPx
            setBackgroundColor(android.graphics.Color.parseColor("#101216"))
        }

        // 1) Placeholder nativo imediato: garante visualização visível mesmo durante cold-start do JS
        val loadingLayout = android.widget.LinearLayout(themedContext).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)

            val titleView = android.widget.TextView(themedContext).apply {
                text = "Teclado do Corretor"
                setTextColor(android.graphics.Color.parseColor("#F1F5F9"))
                textSize = 15f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                gravity = android.view.Gravity.CENTER
            }

            val subtitleView = android.widget.TextView(themedContext).apply {
                text = "Carregando catálogo e atalhos..."
                setTextColor(android.graphics.Color.parseColor("#94A3B8"))
                textSize = 12f
                gravity = android.view.Gravity.CENTER
                setPadding(0, (6 * resources.displayMetrics.density).toInt(), 0, (12 * resources.displayMetrics.density).toInt())
            }

            val progressBar = android.widget.ProgressBar(themedContext).apply {
                isIndeterminate = true
            }

            addView(titleView)
            addView(subtitleView)
            addView(progressBar)
        }
        container.addView(loadingLayout)

        // 2) ReactRootView: sobrepõe o placeholder assim que renderizar o primeiro frame
        try {
            val rootView = ReactRootView(themedContext).apply {
                startReactApplication(
                    reactInstanceManager,
                    MODULE_NAME,
                    Bundle().apply { putString("platform", "android-ime") }
                )
            }
            reactRootView = rootView
            container.addView(rootView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        } catch (t: Throwable) {
            android.util.Log.e("CustomKeyboardService", "Falha ao inicializar ReactRootView do teclado", t)
        }

        rootContainer = container
        return container
    }

    /**
     * O teclado ficou visível para um novo campo de texto.
     */
    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        targetPackage = info?.packageName

        // Assegura que a janela de input method fique na altura da orientação atual
        try {
            val heightPx = keyboardHeightPx()
            rootContainer?.targetHeightPx = heightPx
            window?.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, heightPx)
        } catch (_: Throwable) {}

        try {
            if (reactInstanceManager.lifecycleState != com.facebook.react.common.LifecycleState.RESUMED) {
                reactInstanceManager.onHostResume(null)
            }
        } catch (t: Throwable) {
            android.util.Log.w("CustomKeyboardService", "onHostResume ignorado: ${t.message}")
        }

        emitToJs(EVENT_KEYBOARD_SHOW, Arguments.createMap().apply {
            putString("targetPackage", targetPackage ?: "")
            putBoolean("restarting", restarting)
            putInt("inputType", info?.inputType ?: 0)
        })
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        try {
            emitToJs(EVENT_KEYBOARD_HIDE, Arguments.createMap())
        } catch (_: Throwable) {}
    }

    override fun onDestroy() {
        try {
            reactRootView?.unmountReactApplication()
        } catch (_: Throwable) {}
        reactRootView = null
        rootContainer = null
        if (instanceRef?.get() === this) instanceRef = null
        super.onDestroy()
    }

    // -----------------------------------------------------------------------
    // (B) INTERAÇÃO COM O CAMPO DE TEXTO — InputConnection
    // Todos os métodos abaixo DEVEM ser chamados na Main Thread.
    // -----------------------------------------------------------------------

    /**
     * Injeta texto no campo ativo do app em foco (WhatsApp).
     *
     * commitText(text, newCursorPosition = 1) → insere o texto na posição do
     * cursor (substituindo seleção, se houver) e posiciona o cursor ao final.
     * beginBatchEdit/endBatchEdit agrupam a operação, evitando que o app
     * receba vários callbacks intermediários (flicker / autocorreção).
     */
    fun commitText(text: String): Boolean {
        val ic = currentInputConnection ?: return false
        ic.beginBatchEdit()
        val ok = ic.commitText(text, 1)
        ic.endBatchEdit()
        return ok
    }

    /** Backspace: apaga a seleção, ou 1 caractere antes do cursor. */
    fun deleteBackward(): Boolean {
        val ic = currentInputConnection ?: return false
        val selected = ic.getSelectedText(0)
        return if (!TextUtils.isEmpty(selected)) {
            ic.commitText("", 1)
        } else {
            ic.deleteSurroundingText(1, 0)
        }
    }

    /**
     * Enter: se o campo define uma IME action (Send/Search/Go) dispara-a;
     * caso contrário (WhatsApp multiline) envia KEYCODE_ENTER → nova linha.
     */
    fun sendEnter(): Boolean {
        val ic = currentInputConnection ?: return false
        val ei = currentInputEditorInfo
        val action = (ei?.imeOptions ?: 0) and EditorInfo.IME_MASK_ACTION
        val noEnterAction = ((ei?.imeOptions ?: 0) and EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0

        return if (!noEnterAction &&
            action != EditorInfo.IME_ACTION_NONE &&
            action != EditorInfo.IME_ACTION_UNSPECIFIED
        ) {
            ic.performEditorAction(action)
        } else {
            sendDownUpKeyEvents(KeyEvent.KEYCODE_ENTER)
            true
        }
    }

    /**
     * Tecla 🌐: volta ao teclado anterior (Gboard etc.) para digitação livre.
     * API 28+ possui switchToPreviousInputMethod(); abaixo disso, abre o picker.
     */
    fun switchKeyboard() {
        try {
            val switched = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                switchToPreviousInputMethod()
            } else false

            if (!switched) {
                val imm = getSystemService(INPUT_METHOD_SERVICE) as? InputMethodManager
                imm?.showInputMethodPicker()
            }
        } catch (t: Throwable) {
            android.util.Log.w("CustomKeyboardService", "Não foi possível alternar método de entrada: ${t.message}")
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /** Altura do teclado em pixels para a orientação atual da tela. */
    private fun keyboardHeightPx(): Int {
        val metrics = resources.displayMetrics
        val portraitPx = (KEYBOARD_HEIGHT_DP * metrics.density).toInt()
        if (resources.configuration.orientation != Configuration.ORIENTATION_LANDSCAPE) {
            return portraitPx
        }
        val minPx = (MIN_LANDSCAPE_HEIGHT_DP * metrics.density).toInt()
        val fractionPx = (metrics.heightPixels * LANDSCAPE_SCREEN_FRACTION).toInt()
        return fractionPx.coerceIn(minPx, portraitPx)
    }

    private fun emitToJs(event: String, params: Any) {
        try {
            val ctx: ReactContext = reactInstanceManager.currentReactContext ?: return
            if (!ctx.hasActiveReactInstance()) return
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(event, params)
        } catch (_: Throwable) {}
    }
}
