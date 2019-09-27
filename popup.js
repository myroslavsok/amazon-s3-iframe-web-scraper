console.log('popup works');

const ACTIONS = {
    GET_CONTENT_PAGE_URL: 'get-content-page-url'
};

let currentContentPageUrl = '';

// Popup onOpen
window.onload = function() {
    chrome.tabs.query({active: true, currentWindow: true}, setCurrentContentPageUrl)
};
function setCurrentContentPageUrl(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: ACTIONS.GET_CONTENT_PAGE_URL}, function(response) {
        console.log('response', response.contentPageUrl);
        currentContentPageUrl = response.contentPageUrl;
        document.getElementById('currentUrl').textContent += currentContentPageUrl;
    });
}

// Run scraper
const scrapeBtn = document.getElementById('scrapeBtn');
scrapeBtn.addEventListener('click', runScraper, true);
function runScraper(e) {
    e.preventDefault();
    console.log('test');
    const iframeLink = document.getElementById('iframeLink').value;
    const aSelector = document.getElementById('aSelector').value;
    console.log('iframeLink', iframeLink);
    console.log('aSelector', aSelector);
}






// function startScraping() {
//   const iframeLink = document.getElementById('iframeLink');
//   const aSelector = document.getElementById('aSelector');
//
//   console.log(iframeLink);
//   console.log(aSelector);
// }

// let changeColor = document.getElementById('changeColor');
// // ...
// changeColor.onclick = function(element) {
//   let color = element.target.value;
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.executeScript(
//         tabs[0].id,
//         {code: 'document.body.style.backgroundColor = "' + color + '";'});
//   });
// };

document.addEventListener('DOMContentLoaded', function() {
  // const scrapeBtn = document.getElementById('scrapeBtn');

  // scrapeBtn.
  //
  // var checkPageButton = document.getElementById('checkPage');
  //
  // checkPageButton.addEventListener('click', function() {
  //
  //   chrome.tabs.getSelected(null, function(tab) {
  //     d = document;
  //
  //     var f = d.createElement('form');
  //     f.action = 'http://gtmetrix.com/analyze.html?bm';
  //     f.method = 'post';
  //     var i = d.createElement('input');
  //     i.type = 'hidden';
  //     i.name = 'url';
  //     i.value = tab.url;
  //     f.appendChild(i);
  //     d.body.appendChild(f);
  //     f.submit();
  //   });
  // }, false);
}, false);
