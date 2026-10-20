import UIKit
import React

/**
 * KeyboardViewController — iOS Custom Keyboard Extension
 * ---------------------------------------------------------------------------
 * Equivalente iOS do CustomKeyboardService. Roda em um PROCESSO SEPARADO do
 * app principal (extensão), portanto:
 *   • Precisa de seu próprio RCTBridge (o JS bundle é carregado aqui também).
 *   • Dados do app são compartilhados via App Group (MMKV com AppGroup).
 *   • Info.plist da extensão: RequestsOpenAccess = YES (rede + clipboard).
 *
 * ⚠️ Limite de memória de extensões de teclado (~50–70 MB). Use Hermes,
 *    bundle enxuto (sem libs de mapa/vídeo) e evite imagens grandes.
 */
final class KeyboardViewController: UIInputViewController {

    /// Usado pelo KeyboardBridge (NativeModule) para chegar ao textDocumentProxy.
    static weak var shared: KeyboardViewController?

    private var bridge: RCTBridge?
    private var heightConstraint: NSLayoutConstraint?
    private let keyboardHeight: CGFloat = 320

    override func viewDidLoad() {
        super.viewDidLoad()
        KeyboardViewController.shared = self

        guard let bridge = RCTBridge(delegate: self, launchOptions: nil) else { return }
        self.bridge = bridge

        let rootView = RCTRootView(
            bridge: bridge,
            moduleName: "CorretorKeyboard",
            initialProperties: [
                "platform": "ios-extension",
                "hasFullAccess": hasFullAccess
            ]
        )
        rootView.backgroundColor = .clear
        rootView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(rootView)

        NSLayoutConstraint.activate([
            rootView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            rootView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            rootView.topAnchor.constraint(equalTo: view.topAnchor),
            rootView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        // Prioridade 999 evita conflito com a constraint de altura do sistema.
        let h = view.heightAnchor.constraint(equalToConstant: keyboardHeight)
        h.priority = UILayoutPriority(999)
        h.isActive = true
        heightConstraint = h
    }

    override func updateViewConstraints() {
        super.updateViewConstraints()
        if heightConstraint == nil {
            let h = view.heightAnchor.constraint(equalToConstant: keyboardHeight)
            h.priority = UILayoutPriority(999)
            h.isActive = true
            heightConstraint = h
        } else {
            heightConstraint?.constant = keyboardHeight
        }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        KeyboardBridge.emit("onKeyboardShow", body: [
            "targetPackage": NSNull(), // iOS não expõe o app hospedeiro
            "restarting": false
        ])
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        KeyboardBridge.emit("onKeyboardHide", body: [:])
    }

    // MARK: - (B) Interação com o campo de texto — textDocumentProxy
    // UITextDocumentProxy é o equivalente iOS do InputConnection.

    func insert(_ text: String) { textDocumentProxy.insertText(text) }
    func deleteBackward() { textDocumentProxy.deleteBackward() }
    func sendEnter() { textDocumentProxy.insertText("\n") }
    func switchKeyboard() { advanceToNextInputMode() }
}

// MARK: - RCTBridgeDelegate
extension KeyboardViewController: RCTBridgeDelegate {
    func sourceURL(for bridge: RCTBridge) -> URL? {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
