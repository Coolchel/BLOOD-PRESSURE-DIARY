package expo.modules.diarybackup

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.DocumentsContract
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.Serializable

private data class SaveRequest(val name: String) : Serializable
private class SaveContract : AppContextActivityResultContract<SaveRequest, Uri?> {
  override fun createIntent(context: Context, input: SaveRequest) = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
    addCategory(Intent.CATEGORY_OPENABLE)
    type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    putExtra(Intent.EXTRA_TITLE, input.name)
  }
  override fun parseResult(input: SaveRequest, resultCode: Int, intent: Intent?): Uri? =
    if (resultCode == Activity.RESULT_OK) intent?.data else null
}

class DiaryBackupModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DiaryBackup")
    lateinit var saveLauncher: AppContextActivityResultLauncher<SaveRequest, Uri?>
    RegisterActivityContracts { saveLauncher = registerForActivityResult(SaveContract()) }

    AsyncFunction("saveExcelAsync") Coroutine { uri: String, name: String ->
      val context = requireNotNull(appContext.reactContext)
      val source = File(requireNotNull(Uri.parse(uri).path)).canonicalFile
      val cache = appContext.cacheDirectory.canonicalFile
      require(source.parentFile == cache && name.endsWith(".xlsx")) { "Некорректный файл экспорта." }
      val target = saveLauncher.launch(SaveRequest(name))
      if (target == null) return@Coroutine false
      val output = context.contentResolver.openOutputStream(target, "w")
        ?: error("Не удалось сохранить файл.")
      try { output.use { stream -> source.inputStream().use { it.copyTo(stream) } } }
      catch (error: Exception) {
        // Remove a partial file created by this export, never a pre-existing document.
        try { DocumentsContract.deleteDocument(context.contentResolver, target) } catch (_: Exception) {}
        throw error
      }
      true
    }

    AsyncFunction("openDirectoryAsync") { uri: String, bookmark: String? ->
      val context = requireNotNull(appContext.reactContext)
      val input = Uri.parse(uri)
      val folder = if (input.scheme == "content") {
        if (DocumentsContract.isTreeUri(input))
          DocumentsContract.buildDocumentUriUsingTree(input, DocumentsContract.getTreeDocumentId(input)) else input
      } else {
        require(File(requireNotNull(input.path)).canonicalFile == appContext.persistentFilesDirectory.canonicalFile)
        DocumentsContract.buildDocumentUri(context.packageName + ".diarybackup.documents", "backup-root")
      }
      // System document browser, starting in the actual backup folder; selected files are not imported.
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "application/json"
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) putExtra(DocumentsContract.EXTRA_INITIAL_URI, folder)
      }
      requireNotNull(appContext.currentActivity).startActivity(intent)
    }.runOnQueue(expo.modules.kotlin.functions.Queues.MAIN)
  }
}
