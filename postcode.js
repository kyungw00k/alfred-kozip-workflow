ObjC.import('Cocoa')

function search(q) {
  var stdout = $.NSPipe.pipe
  var task = $.NSTask.alloc.init

  task.setLaunchPath('/usr/bin/curl')
  task.setArguments([
    '-X',
    'POST',
    `https://api.poesis.kr/post/search.php?q=${encodeURIComponent(q.normalize('NFC'))}`
  ])
  task.standardOutput = stdout
  task.launch

  var dataOut = stdout.fileHandleForReading.readDataToEndOfFile
  var stringOut = $.NSString.alloc.initWithDataEncoding(dataOut, $.NSUTF8StringEncoding).js

  return JSON.parse(stringOut)
}

function render(q) {
  var response = search(q)
  var lists = []

  if (response.error) {
    lists.unshift(`
        <item valid="NO">
            <title>${response.error}</title>
        </item>`)
    lists.join('\n')
  } else {

    if ( response.count < 100 ) {
      lists = [`
        <item valid="NO">
            <title>"${q}"로 검색한 항목이 총 ${response.count}개 있습니다.</title>
        </item>`]
    } else {
      lists = [`
        <item valid="NO">
            <title>"${q}"로 검색한 항목이 너무 많아 100건만 표시합니다.</title>
            <subtitle>정확한 도로명과 건물번호 또는 동·리와 번지로 검색해 주시기 바랍니다.</subtitle>
        </item>`]
    }

    lists = lists.concat(response.results
      .map(function (i) {
        return `
          <item valid="YES">
              <title>${i.postcode5}(${i.postcode6.replace(/(\d\d\d)(\d\d\d)/, '$1-$2')})\n${i.addr}</title>
              <subtitle>${i.ko_common} ${i.ko_doro} ${i.building_name ? '(' + i.building_name + ')' : ''} ${i.postcode5}</subtitle>
              <subtitle mod="ctrl">${i.en_doro} ${i.en_common} ${i.postcode5}</subtitle>
              <subtitle mod="shift">${i.en_jibeon} ${i.en_common} ${i.postcode6.replace(/(\d\d\d)(\d\d\d)/, '$1-$2')}</subtitle>
              <subtitle mod="fn">${i.ko_common} ${i.ko_jibeon} ${i.building_name} ${i.postcode6.replace(/(\d\d\d)(\d\d\d)/, '$1-$2')}</subtitle>
              <subtitle mod="cmd">지도에서 보기</subtitle>
              <arg>${JSON.stringify(i)}</arg>
          </item>`
      })).join('\n')
  }

  return `<?xml version='1.0' encoding="UTF-8"?>\n<items>\n${lists}\n</items>`
}

if (typeof module === "object") {
  module.exports = render;
}
