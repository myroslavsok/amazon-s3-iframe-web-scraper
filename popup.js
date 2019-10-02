const ACTIONS = {
    FIND_IFRAME_ACTION: 'find-iframe-action',
    GET_TARGET_LINKS: 'get-target-links',
    DOWNLOAD_CSV: 'download-csv'
};

const STATUSES = {
    PENDING: 'Pending. Wait for about 1 minute, please...',
    COMPLETE: 'Completed'
};

// Enabling getTargetLinksBtn if paren page url and iframe src is stored
window.onload = () => {
    chrome.storage.local.get(['pageAndIframeUrls'], result => {
        setMetaData(result.pageAndIframeUrls); // set meta data on view
        if (result.pageAndIframeUrls && result.pageAndIframeUrls.iframeSrc) {
            disableGetTargetLinksBtn(false); // enable getTargetLinksBtn
        } else {
            disableGetTargetLinksBtn(true); // disable getTargetLinksBtn
        }
    });
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
            // get iframe src from input
            const iframeSrcLinkInput = document.getElementById('iframeSrcLinkInput');
            if (iframeSrcLinkInput.value) {
                pageAndIframeUrls.iframeSrc = iframeSrcLinkInput.value;
                setMetaData(pageAndIframeUrls);
            }
            chrome.storage.local.set({'pageAndIframeUrls': pageAndIframeUrls}, () => {
                setMetaData(pageAndIframeUrls);
                if (!pageAndIframeUrls.iframeSrc) {
                    disableGetTargetLinksBtn(true);
                    alert('Iframe is not found. Try to insert iframe src link to corresponding input manually and press Find iframe one more time.');
                } else {
                    disableGetTargetLinksBtn(false);
                    if (window.confirm('Iframe was found and marked with blue border. Press OK to got to iframe src link.')) {
                        chrome.tabs.create({url: pageAndIframeUrls.iframeSrc});
                    }
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
            if (!result.pageAndIframeUrls) {
                return alert('No data provided (iframe src, main page url). Try to repeat full operation from the scratch.');
            }
            const targetAHrefsUrl = getTargetAHrefsUrl(result.pageAndIframeUrls);
            const message = {
                action: ACTIONS.GET_TARGET_LINKS,
                targetAHrefsUrl: targetAHrefsUrl
            };
            chrome.tabs.sendMessage(tabs[0].id, message, targetAHrefsUrls => {
                let exhibitorsArray;
                setAmountOfLinks(targetAHrefsUrls.length); // Update amount of links field
                setStatus(STATUSES.PENDING); // Update status field
                getExhibitorsArrayByTargetAHrefsUrls(targetAHrefsUrls, result.pageAndIframeUrls.iframeSrc).then(exhibitorsJSON => {
                    exhibitorsArray = exhibitorsJSON
                        .map(JSON.parse)
                        .map(exhibitor => extractExhibitorData(exhibitor, targetAHrefsUrl));
                    const exhibitorsCSV = parseDateToCSV(exhibitorsArray);
                    const messageDownloadCSV = {
                        action: ACTIONS.DOWNLOAD_CSV,
                        exhibitorsCSV: exhibitorsCSV
                    };
                    chrome.tabs.sendMessage(tabs[0].id, messageDownloadCSV, response => {
                        setStatus(STATUSES.COMPLETE);
                        setMetaData(null); // set meta data on view
                        chrome.storage.local.set({'pageAndIframeUrls': null}); // clear storage
                        disableGetTargetLinksBtn(true);
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
        biography: exhibitor.biography,
        profileUrl: targetAHrefsUrl + exhibitor.identifier,
        website: exhibitor.website
    };
}

// Parse to CSV
function parseDateToCSV(data) {
    if (!data || !data.length) {
        return;
    }
    const separator = ',';
    const keys = Object.keys(data[0]);
    return keys.join(separator) +
        '\n' +
        data.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                cell = cell instanceof Date
                    ? cell.toLocaleString()
                    : cell.toString().replace(/"/g, '""');
                if (cell.search(/([",\n])/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(separator);
        }).join('\n');
}

function setStatus(statusTxt) {
    document.getElementById('statusSpan').textContent = statusTxt;
}

function setAmountOfLinks(amountOfLinks) {
    document.getElementById('foundLinkField').textContent = amountOfLinks ? `${amountOfLinks} links were found`: `No link were found`;
}

function setMetaData(pageAndIframeUrls) {
    // pageAndIframeUrls includes .iframeSrc && .currentPageUrl
    document.getElementById('parentPageField').textContent =
        (pageAndIframeUrls && pageAndIframeUrls.currentPageUrl) ? pageAndIframeUrls.currentPageUrl : '';
    document.getElementById('iframeSrcField').textContent =
        (pageAndIframeUrls && pageAndIframeUrls.iframeSrc) ? pageAndIframeUrls.iframeSrc : '';
}

function disableGetTargetLinksBtn(disableBoolean) {
    document.getElementById('getTargetLinksBtn').disabled = disableBoolean;
}

