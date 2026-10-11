import ExpoModulesCore
import Foundation
import UIKit
import UniformTypeIdentifiers

private let backupFilename = "davlenie-autobackup.json"

public class DiaryBackupModule: Module {
  private var folderPicker: BackupFolderPicker?
  private var filePicker: BackupFilePicker?

  public func definition() -> ModuleDefinition {
    Name("DiaryBackup")

    AsyncFunction("saveExcelAsync") { (uri: String, name: String, promise: Promise) in
      guard self.filePicker == nil, self.folderPicker == nil,
        let url = URL(string: uri), url.isFileURL,
        let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("FILE_PICKER_UNAVAILABLE", "Не удалось открыть сохранение файла.")
        return
      }
      let delegate = BackupFilePicker(promise: promise) { self.filePicker = nil }
      self.filePicker = delegate
      let picker = UIDocumentPickerViewController(forExporting: [url], asCopy: true)
      picker.delegate = delegate
      presenter.present(picker, animated: true)
      picker.presentationController?.delegate = delegate
    }.runOnQueue(.main)

    AsyncFunction("openDirectoryAsync") { (uri: String, bookmark: String?, promise: Promise) in
      guard self.filePicker == nil, self.folderPicker == nil,
        let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("FILE_PICKER_UNAVAILABLE", "Не удалось открыть папку.")
        return
      }
      do {
        var folder = URL(string: uri)
        var scoped = false
        if let bookmark {
          guard let data = Data(base64Encoded: bookmark) else { throw backupAccessError() }
          var stale = false
          folder = try URL(resolvingBookmarkData: data, bookmarkDataIsStale: &stale)
          guard !stale, let folder, folder.startAccessingSecurityScopedResource() else { throw backupAccessError() }
          scoped = true
        }
        guard let folder else { throw backupAccessError() }
        let delegate = BackupFilePicker(promise: promise) {
          if scoped { folder.stopAccessingSecurityScopedResource() }
          self.filePicker = nil
        }
        self.filePicker = delegate
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.item], asCopy: false)
        picker.directoryURL = folder
        picker.delegate = delegate
        presenter.present(picker, animated: true)
        picker.presentationController?.delegate = delegate
      } catch { promise.reject(error) }
    }.runOnQueue(.main)

    AsyncFunction("pickDirectoryAsync") { (initialUri: String?, promise: Promise) in
      guard self.folderPicker == nil, self.filePicker == nil,
        let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("BACKUP_PICKER_UNAVAILABLE", "Не удалось открыть выбор папки.")
        return
      }
      let delegate = BackupFolderPicker(promise: promise) { self.folderPicker = nil }
      self.folderPicker = delegate
      let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.folder], asCopy: false)
      picker.allowsMultipleSelection = false
      picker.delegate = delegate
      if let initialUri { picker.directoryURL = URL(string: initialUri) }
      presenter.present(picker, animated: true)
      picker.presentationController?.delegate = delegate
    }.runOnQueue(.main)

    AsyncFunction("existsAsync") { (bookmark: String) -> Bool in
      try withBackupFolder(bookmark) { folder in
        FileManager.default.fileExists(atPath: folder.appendingPathComponent(backupFilename).path)
      }
    }

    AsyncFunction("readAsync") { (bookmark: String) -> String? in
      try withBackupFolder(bookmark) { folder in
        let file = folder.appendingPathComponent(backupFilename)
        guard FileManager.default.fileExists(atPath: file.path) else { return nil }
        var coordinationError: NSError?
        var result: Result<String, Error>?
        NSFileCoordinator().coordinate(readingItemAt: file, error: &coordinationError) { url in
          result = Result { try String(contentsOf: url, encoding: .utf8) }
        }
        if let coordinationError { throw coordinationError }
        guard let result else { throw backupAccessError() }
        return try result.get()
      }
    }

    AsyncFunction("writeAsync") { (bookmark: String, content: String) in
      try withBackupFolder(bookmark) { folder in
        let file = folder.appendingPathComponent(backupFilename)
        var coordinationError: NSError?
        var result: Result<Void, Error>?
        NSFileCoordinator().coordinate(writingItemAt: file, options: .forReplacing, error: &coordinationError) { url in
          result = Result { try Data(content.utf8).write(to: url, options: .atomic) }
        }
        if let coordinationError { throw coordinationError }
        guard let result else { throw backupAccessError() }
        try result.get()
      }
    }

    AsyncFunction("deleteAsync") { (bookmark: String) in
      try withBackupFolder(bookmark) { folder in
        let file = folder.appendingPathComponent(backupFilename)
        guard FileManager.default.fileExists(atPath: file.path) else { return }
        var coordinationError: NSError?
        var result: Result<Void, Error>?
        NSFileCoordinator().coordinate(writingItemAt: file, options: .forDeleting, error: &coordinationError) { url in
          result = Result { try FileManager.default.removeItem(at: url) }
        }
        if let coordinationError { throw coordinationError }
        guard let result else { throw backupAccessError() }
        try result.get()
      }
    }
  }
}

private class BackupFilePicker: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private var promise: Promise?
  private let finished: () -> Void
  init(promise: Promise, finished: @escaping () -> Void) { self.promise = promise; self.finished = finished }
  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) { complete(true) }
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { complete(false) }
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { complete(false) }
  private func complete(_ selected: Bool) {
    guard let promise else { return }
    self.promise = nil; promise.resolve(selected); finished()
  }
}

private func backupAccessError() -> NSError {
  NSError(domain: "DiaryBackup", code: 1, userInfo: [
    NSLocalizedDescriptionKey: "Папка недоступна. Выберите её снова в настройках."
  ])
}

private func withBackupFolder<T>(_ bookmark: String, work: (URL) throws -> T) throws -> T {
  guard let data = Data(base64Encoded: bookmark) else { throw backupAccessError() }
  var stale = false
  let folder = try URL(resolvingBookmarkData: data, bookmarkDataIsStale: &stale)
  guard !stale, folder.startAccessingSecurityScopedResource() else { throw backupAccessError() }
  defer { folder.stopAccessingSecurityScopedResource() }
  return try work(folder)
}

private class BackupFolderPicker: NSObject, UIDocumentPickerDelegate, UIAdaptivePresentationControllerDelegate {
  private var promise: Promise?
  private let finished: () -> Void

  init(promise: Promise, finished: @escaping () -> Void) {
    self.promise = promise
    self.finished = finished
  }

  func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard let promise else { return }
    defer { self.promise = nil; finished() }
    guard let folder = urls.first, folder.startAccessingSecurityScopedResource() else {
      promise.reject(backupAccessError())
      return
    }
    defer { folder.stopAccessingSecurityScopedResource() }
    do {
      // Apple's directory-access API persists the security-scoped URL as a minimal bookmark.
      let bookmark = try folder.bookmarkData(options: .minimalBookmark, includingResourceValuesForKeys: nil, relativeTo: nil)
      promise.resolve([
        "uri": folder.absoluteString,
        "label": folder.lastPathComponent,
        "bookmark": bookmark.base64EncodedString()
      ])
    } catch { promise.reject(error) }
  }

  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) { cancel() }
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) { cancel() }

  private func cancel() {
    guard let promise else { return }
    self.promise = nil
    promise.resolve(nil)
    finished()
  }
}
