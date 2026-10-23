package com.corretorkeyboard.keyboard

import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * AudioRecorderModule
 * ---------------------------------------------------------------------------
 * Grava áudio do microfone no app (atalhos de áudio), exposto ao JS como
 * `NativeModules.KeyconAudioRecorder`.
 *
 * Formato: M4A (AAC, mono, 44,1 kHz, 96 kbps) — toca no WhatsApp, Telegram e
 * em qualquer celular, e um minuto fica com cerca de 700 KB.
 * A permissão RECORD_AUDIO é pedida pelo JS (PermissionsAndroid) antes de start().
 */
class AudioRecorderModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "KeyconAudioRecorder"

    private var recorder: MediaRecorder? = null
    private var output: File? = null
    private var startedAt = 0L

    @ReactMethod
    fun start(promise: Promise) {
        release(deleteFile = true)
        try {
            val dir = File(reactApplicationContext.cacheDir, RECORDINGS_DIR).apply { mkdirs() }
            val file = File(dir, "audio-${System.currentTimeMillis()}.m4a")
            val r = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(reactApplicationContext)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }
            r.setAudioSource(MediaRecorder.AudioSource.MIC)
            r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            r.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            r.setAudioChannels(1)
            r.setAudioSamplingRate(44_100)
            r.setAudioEncodingBitRate(96_000)
            r.setMaxDuration(MAX_DURATION_MS)
            r.setOutputFile(file.absolutePath)
            r.prepare()
            r.start()
            recorder = r
            output = file
            startedAt = SystemClock.elapsedRealtime()
            promise.resolve(true)
        } catch (t: Throwable) {
            release(deleteFile = true)
            promise.reject("E_RECORD", "Não foi possível usar o microfone: ${t.message ?: "erro desconhecido"}", t)
        }
    }

    /** Para a gravação e devolve o arquivo: { uri, name, mimeType, size, durationMs }. */
    @ReactMethod
    fun stop(promise: Promise) {
        val r = recorder
        val file = output
        if (r == null || file == null) {
            promise.reject("E_NOT_RECORDING", "Nenhuma gravação em andamento.")
            return
        }
        val durationMs = SystemClock.elapsedRealtime() - startedAt
        try {
            r.stop()
        } catch (t: Throwable) {
            // stop() falha quando quase nada foi gravado
            release(deleteFile = true)
            promise.reject("E_TOO_SHORT", "A gravação ficou curta demais. Segure por pelo menos 1 segundo.", t)
            return
        }
        r.release()
        recorder = null
        output = null
        promise.resolve(Arguments.createMap().apply {
            putString("uri", Uri.fromFile(file).toString())
            putString("name", file.name)
            putString("mimeType", "audio/mp4")
            putDouble("size", file.length().toDouble())
            putDouble("durationMs", durationMs.toDouble())
        })
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        release(deleteFile = true)
        promise.resolve(true)
    }

    private fun release(deleteFile: Boolean) {
        recorder?.let { r ->
            try {
                r.stop()
            } catch (_: Throwable) {
            }
            r.release()
        }
        recorder = null
        if (deleteFile) output?.delete()
        output = null
    }

    override fun invalidate() {
        release(deleteFile = true)
        super.invalidate()
    }

    companion object {
        private const val RECORDINGS_DIR = "recordings"
        /** 5 minutos: atalho de áudio é curto. */
        private const val MAX_DURATION_MS = 5 * 60 * 1000
    }
}
