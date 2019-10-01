console.log('popup works');

const ACTIONS = {
    GET_CURRENT_PAGE_URL: 'get-content-page-url',
    GET_TARGET_A_HREFS: 'get-target-a-hrefs',
    GET_IFRAME_PRODUCT_LINKS: 'get-iframe-product-links',

    FIND_IFRAME_ACTION: 'find-iframe-action',
    GET_TARGET_LINKS: 'get-target-links',
};

// Popup onOpen
window.onload = function () {
    // const newURL = "http://www.youtube.com/watch?v=oHg5SJYRHA0";
    // chrome.tabs.create({ url: newURL });

    // chrome.tabs.query({active: true, currentWindow: true}, setCurrentContentPageUrl)

    // chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    //     const message = {
    //         action: ACTIONS.GET_CURRENT_PAGE_URL
    //     };
    //     chrome.tabs.sendMessage(tabs[0].id, message, response => {
    //         currentContentPageUrl = response;
    //         console.log('onload', currentContentPageUrl);
    //         setCurrentContentPageUrl(currentContentPageUrl);
    //     });
    // });
};

// Search iframe
const findIframeBtn = document.getElementById('findIframeBtn');
findIframeBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        const message = {
            action: ACTIONS.FIND_IFRAME_ACTION
        };
        chrome.tabs.sendMessage(tabs[0].id, message, pageAndIframeUrls => {
            // pageAndIframeUrls includes .iframeSrc && .currentPageUrl
            chrome.storage.local.set({'pageAndIframeUrls': pageAndIframeUrls}, () => {
                // TODO Mirek add null handler
                if (window.confirm('Would you like to go to iframe link?')) {
                    chrome.tabs.create({url: pageAndIframeUrls.iframeSrc});
                }
            });
        });
    });
}, true);

// Get a hrefs for future fetching
const getTargetLinksBtn = document.getElementById('getTargetLinksBtn');
getTargetLinksBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.storage.local.get(['pageAndIframeUrls'], result => {
            const targetAHrefsUrl = getTargetAHrefsUrl(result.pageAndIframeUrls);
            const message = {
                action: ACTIONS.GET_TARGET_LINKS,
                targetAHrefsUrl: targetAHrefsUrl
            };
            console.log('message', message);
            chrome.tabs.sendMessage(tabs[0].id, message, targetAHrefsUrls => {
                let exhibitorsArray;
                getExhibitorsArrayByTargetAHrefsUrls(targetAHrefsUrls, result.pageAndIframeUrls.iframeSrc).then(exhibitors => {
                    console.log('exhibitors', exhibitors);
                    exhibitorsArray = exhibitors;
                });
            });
        });
    });
}, true);

// Fetch exhibitors and process their data
function getExhibitorsArrayByTargetAHrefsUrls(targetAHrefsUrls, iframeSrc) {
    const iframeSrcParams = getIframeSrcParams(iframeSrc);
    const exhibitorCommonUrl = `https://${iframeSrcParams.organization}.control.buzz/campaign/${iframeSrcParams.campaign}/web-module/${iframeSrcParams.webModuleId}${iframeSrcParams.webModulePathName}`;
    let exhibitorsLinksArr = [];
    targetAHrefsUrls.forEach(aHref => {
        const companyId = aHref.split('/').pop();
        const exhibitorUrl = exhibitorCommonUrl + companyId;
        exhibitorsLinksArr.push(exhibitorUrl);
    });
    return Promise.all(exhibitorsLinksArr.map(link => fetch(link))).then(exhibitorResponses =>
        Promise.all(exhibitorResponses.map(exhibitor => exhibitor.text()))
    );

    // Promise.allSettled(exhibitorsFetchArr).then(resultsArr => {
    //     resultsArr
    //         .filter(result => result.status === 'fulfilled')
    //         .map(result => result.value.text().then(exhibitorResponseData => {
    //             const exhibitorData = JSON.parse(exhibitorResponseData);
    //             console.log('exhibitor', JSON.parse(exhibitorResponseData));
    //             return {
    //                 identifier: exhibitorData.identifier,
    //                 name: exhibitorData.name,
    //                 stand: exhibitorData.stands[0],
    //                 biography: exhibitorData.biography,
    //                 // profileUrl: aHref, // TODO: Mirek add hrefs
    //                 website: exhibitorData.website
    //             };
    //         }));
    // });

}

// href value that is user in select
function getTargetAHrefsUrl(pageAndIframeUrls) {
    const linkPartsArr = pageAndIframeUrls.currentPageUrl.split("/");
    const parentUrlDomain = linkPartsArr[0] + "//" + linkPartsArr[2];
    const iframeSrcParams = getIframeSrcParams(pageAndIframeUrls.iframeSrc);
    return `${parentUrlDomain}/${iframeSrcParams.webModuleId}/#${iframeSrcParams.webModulePathName}`;
}

// Extract parameter from iframe src (necessary for link fetch queries)
function getIframeSrcParams(iframeSrc) {
    const iframeSrcToUrl = new URL(iframeSrc.replace('#', '')); // delete anchor symbol from URL because it does not allow to extract params
    return {
        webModuleId: iframeSrcToUrl.searchParams.get('web-module-id'),
        campaign: iframeSrcToUrl.searchParams.get('campaign'),
        organization: iframeSrcToUrl.searchParams.get('organization'),
        webModulePathName: iframeSrcToUrl.searchParams.get('web-module-pathname'),
    };
}


// function setCurrentContentPageUrl(currentPageUrl) {
//     document.getElementById('currentUrl').textContent += currentPageUrl;
// }

// Run scraper
// const scrapeForm = document.getElementById('scrapeForm');
// scrapeForm.addEventListener('submit', runScraper, true);
// function runScraper(e) {
//     e.preventDefault();
//     const iframeLink = document.getElementById('iframeLink').value;
//     // const aSelector = document.getElementById('aSelector').value;
//     console.log('iframeLink', iframeLink);
//     console.log('aSelector', aSelector);
//     getTargetAHrefs(aSelector);
// }

// Get links for fetching
// function getTargetAHrefs(selector) {
//     chrome.tabs.query({active: true, currentWindow: true}, tabs => {
//         const message = {action: ACTIONS.GET_TARGET_A_HREFS, selector: selector};
//         chrome.tabs.sendMessage(tabs[0].id, message, response => {
//             console.log('linkArray', response);
//         });
//     })
// }


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

// document.addEventListener('DOMContentLoaded', function () {
//     // const scrapeBtn = document.getElementById('scrapeBtn');
//
//     // scrapeBtn.
//     //
//     // var checkPageButton = document.getElementById('checkPage');
//     //
//     // checkPageButton.addEventListener('click', function() {
//     //
//     //   chrome.tabs.getSelected(null, function(tab) {
//     //     d = document;
//     //
//     //     var f = d.createElement('form');
//     //     f.action = 'http://gtmetrix.com/analyze.html?bm';
//     //     f.method = 'post';
//     //     var i = d.createElement('input');
//     //     i.type = 'hidden';
//     //     i.name = 'url';
//     //     i.value = tab.url;
//     //     f.appendChild(i);
//     //     d.body.appendChild(f);
//     //     f.submit();
//     //   });
//     // }, false);
// }, false);
