package expo.modules.diarybackup

import android.database.Cursor
import android.database.MatrixCursor
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.provider.DocumentsContract.Document
import android.provider.DocumentsContract.Root
import android.provider.DocumentsProvider
import java.io.File
import java.io.FileNotFoundException

/** Expose only the default backup snapshot, never the database, drafts or other private files. */
class BackupDocumentsProvider : DocumentsProvider() {
  private val filename = "davlenie-autobackup.json"
  private val rootId = "backup-root"
  private val fileId = "backup-file"
  private val backup: File get() = File(requireNotNull(context).filesDir, filename)
  private val documentColumns = arrayOf(Document.COLUMN_DOCUMENT_ID, Document.COLUMN_DISPLAY_NAME,
    Document.COLUMN_MIME_TYPE, Document.COLUMN_SIZE, Document.COLUMN_LAST_MODIFIED, Document.COLUMN_FLAGS)
  override fun onCreate() = true
  override fun queryRoots(projection: Array<out String>?): Cursor {
    val cursor = MatrixCursor(projection ?: arrayOf(Root.COLUMN_ROOT_ID, Root.COLUMN_DOCUMENT_ID, Root.COLUMN_TITLE, Root.COLUMN_FLAGS, Root.COLUMN_MIME_TYPES))
    cursor.newRow().apply {
      add(Root.COLUMN_ROOT_ID, rootId); add(Root.COLUMN_DOCUMENT_ID, rootId)
      add(Root.COLUMN_TITLE, "Давление"); add(Root.COLUMN_FLAGS, 0); add(Root.COLUMN_MIME_TYPES, "application/json")
    }
    return cursor
  }
  override fun queryDocument(documentId: String, projection: Array<out String>?): Cursor =
    MatrixCursor(projection ?: documentColumns).also { addDocument(it, documentId) }
  override fun queryChildDocuments(parentDocumentId: String, projection: Array<out String>?, sortOrder: String?): Cursor {
    if (parentDocumentId != rootId) throw FileNotFoundException()
    return MatrixCursor(projection ?: documentColumns).also { if (backup.exists()) addDocument(it, fileId) }
  }
  private fun addDocument(cursor: MatrixCursor, id: String) {
    if (id != rootId && (id != fileId || !backup.exists())) throw FileNotFoundException()
    val row = cursor.newRow()
    row.add(Document.COLUMN_DOCUMENT_ID, id)
    row.add(Document.COLUMN_DISPLAY_NAME, if (id == rootId) "Давление" else filename)
    row.add(Document.COLUMN_MIME_TYPE, if (id == rootId) Document.MIME_TYPE_DIR else "application/json")
    row.add(Document.COLUMN_SIZE, if (id == rootId) 0 else backup.length())
    row.add(Document.COLUMN_LAST_MODIFIED, if (id == rootId) null else backup.lastModified())
    row.add(Document.COLUMN_FLAGS, 0)
  }
  override fun openDocument(documentId: String, mode: String, signal: CancellationSignal?): ParcelFileDescriptor {
    if (documentId != fileId || mode != "r") throw FileNotFoundException()
    return ParcelFileDescriptor.open(backup, ParcelFileDescriptor.MODE_READ_ONLY)
  }
  override fun isChildDocument(parentDocumentId: String, documentId: String) = parentDocumentId == rootId && documentId == fileId
}
