const cheerio = require('cheerio');

async function readUrl(url) {
  const res = await fetch(url);
  const $ = cheerio.load(await res.text());
  const $content = $('#main-content');
  // We should filter out both auto-detected pushes and AutoGiveP pushes.
  const result = [];
  $content
    .find('.push-userid, .f3.b1.hl')
    .filter(function filterInvalidPush() {
      return $(this).prev()
        .text()
        .trim()
        .match(/^推|噓|→$/);
    })
    .each(function getResults() {
      const $this = $(this);
      result.push([
        $this.text().trim(),
        $this.prev().text() + $this.text() + $this.next().text(),
      ]);
    });
  return result;
}

async function go(event) {
  event.preventDefault();
  const urls = document.getElementById('urls').value.trim().split(/[\r\n]+/);
  const promises = [];
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    if (url.startsWith('https://www.ptt.cc/bbs/LoL/')) {
      promises.push(readUrl(url));
    } else {
      promises.push([]);
    }
  }
  const result = new Map();
  const pushFromUrls = await Promise.all(promises);
  // Get all the push contents, collect them to the map by ID.
  for (let i = 0; i < pushFromUrls.length; i += 1) {
    const pushes = pushFromUrls[i];
    for (let j = 0; j < pushes.length; j += 1) {
      const push = pushes[j];
      const pushId = push[0];
      const pushContent = push[1];
      if (!result.has(pushId)) {
        result.set(pushId, []);
      }
      result.get(pushId).push({ from: i + 1, content: pushContent });
    }
  }
  // Let's find out the beggars.
  let output = '';
  let beggarCount = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const [pushId, pushFound] of result.entries()) {
    if (pushFound.length >= 2) {
      beggarCount += 1;
      output += `${pushId}\n\n`;
      for (let i = 0; i < pushFound.length; i += 1) {
        output += `[${pushFound[i].from}] ${pushFound[i].content}\n`;
      }
      output += '\n\n';
    }
  }
  output += `總共找到 ${beggarCount} 位疑似乞丐！`;

  document.getElementById('output').value = output;
}

document.getElementById('form').addEventListener('submit', go, false);
