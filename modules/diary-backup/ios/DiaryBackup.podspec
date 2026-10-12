Pod::Spec.new do |s|
  s.name = 'DiaryBackup'
  s.version = '1.0.0'
  s.summary = 'Persistent access to a selected diary backup directory'
  s.description = s.summary
  s.license = '0BSD'
  s.author = 'Blood Pressure Diary'
  s.homepage = 'https://docs.expo.dev/modules/'
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
