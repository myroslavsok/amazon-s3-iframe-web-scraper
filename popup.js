const ACTIONS = {
    FIND_IFRAME_ACTION: 'find-iframe-action',
    GET_TARGET_LINKS: 'get-target-links',
    DOWNLOAD_CSV: 'download-csv'
};

// Must be the same order of properties as in extractExhibitorData()
const HEADERS_CSV = {
    name: 'Company name',
    stand: 'Stand number',
    biography: 'Biography',
    profileUrl: 'Profile url',
    website: 'Website'
};

const FILE_TITLE = 'exhibitors';

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
            chrome.tabs.sendMessage(tabs[0].id, message, targetAHrefsUrls => {
                let exhibitorsArray;

                let statusSpan = document.getElementById('statusSpan');
                statusSpan.textContent = 'Wait please...';

                getExhibitorsArrayByTargetAHrefsUrls(targetAHrefsUrls, result.pageAndIframeUrls.iframeSrc).then(exhibitorsJSON => {
                    exhibitorsArray = exhibitorsJSON
                        .map(JSON.parse)
                        .map(exhibitor => extractExhibitorData(exhibitor, targetAHrefsUrl));
                    const exhibitorsCSV = parseDateToCSV({data: exhibitorsArray});
                    console.log('exhibitorsArray', exhibitorsArray);
                    const messageDownloadCSV = {
                        action: ACTIONS.DOWNLOAD_CSV,
                        exhibitorsCSV: exhibitorsCSV
                    };
                    chrome.tabs.sendMessage(tabs[0].id, messageDownloadCSV, response => {
                        console.log('response back');
                        statusSpan.textContent = 'None';
                    });

                });
            });
        });
    });
}, true);

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
}

// Must be the same order of properties as in HEADERS_CSV
function extractExhibitorData(exhibitor, targetAHrefsUrl) {
    return {
        name: exhibitor.name,
        stand: exhibitor.stands[0],
        // TODO Mirek resolve issue with long text
        // biography: exhibitor.biography, // so as to avoid errors while generating CSV
        profileUrl: targetAHrefsUrl + exhibitor.identifier,
        website: exhibitor.website
    };
}

// Parse to CSV
function parseDateToCSV({data = null, columnDelimiter = ",", lineDelimiter = "\n"}) {
    let result, ctr, keys;
    if (data === null || !data.length) {
        return null
    }
    keys = Object.keys(data[0]);
    result = "";
    result += keys.join(columnDelimiter);
    result += lineDelimiter;
    data.forEach(item => {
        ctr = 0;
        keys.forEach(key => {
            if (ctr > 0) {
                result += columnDelimiter
            }
            result += typeof item[key] === "string" && item[key].includes(columnDelimiter) ? `"${item[key]}"` : item[key];
            ctr++
        });
        result += lineDelimiter
    });
    return result
}
