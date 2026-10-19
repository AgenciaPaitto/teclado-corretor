import Foundation
import React

/**
 * KeyboardBridge (iOS) — mesma API JS do módulo Android:
 *   insertText, deleteBackward, sendEnter, switchKeyboard, getTargetApp,
 *   isKeyboardContext + eventos onKeyboardShow / onKeyboardHide.
 */
@objc(KeyboardBridge)
final class KeyboardBridge: RCTEventEmitter {

    private static weak var current: KeyboardBridge?
    private var hasListeners = false

    override init() {
        super.init()
        KeyboardBridge.current = self
    }

    override static func requiresMainQueueSetup() -> Bool { true }
    override func supportedEvents() -> [String]! { ["onKeyboardShow", "onKeyboardHide"] }
    override func startObserving() { hasListeners = true }
    override func stopObserving() { hasListeners = false }

    static func emit(_ name: String, body: [String: Any]) {
        guard let module = current, module.hasListeners else { return }
        module.sendEvent(withName: name, body: body)
    }

    private func onMain(_ resolve: @escaping RCTPromiseResolveBlock,
                        _ reject: @escaping RCTPromiseRejectBlock,
                        _ block: @escaping (KeyboardViewController) -> Any?) {
        DispatchQueue.main.async {
            guard let vc = KeyboardViewController.shared else {
                reject("E_IME_INACTIVE", "O teclado do corretor não está ativo.", nil)
                return
            }
            resolve(block(vc))
        }
    }

    @objc func insertText(_ text: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        onMain(resolve, reject) { $0.insert(text); return true }
    }

    @objc func deleteBackward(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        onMain(resolve, reject) { $0.deleteBackward(); return true }
    }

    @objc func sendEnter(_ resolve: @escaping RCTPromiseResolveBlock,
                         rejecter reject: @escaping RCTPromiseRejectBlock) {
        onMain(resolve, reject) { $0.sendEnter(); return true }
    }

    @objc func switchKeyboard(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        onMain(resolve, reject) { $0.switchKeyboard(); return true }
    }

    @objc func getTargetApp(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(nil)
    }

    @objc func isKeyboardContext(_ resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve(KeyboardViewController.shared != nil)
    }
}
