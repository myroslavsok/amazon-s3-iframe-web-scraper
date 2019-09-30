console.log("content works");

// document.getElementById('webModuleHolderIframe').onload= function() {
//     console.log('loaded', document.getElementById('webModuleHolderIframe'));
// };

const ACTIONS = {
    GET_CURRENT_PAGE_URL: 'get-content-page-url',
    GET_TARGET_A_HREFS: 'get-target-a-hrefs',
    GET_IFRAME_PRODUCT_LINKS: 'get-iframe-product-links',

    FIND_IFRAME_ACTION: 'find-iframe-action',
    GET_TARGET_LINKS: 'get-target-links',
};

// Message listener
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.action) {
        // case ACTIONS.GET_CURRENT_PAGE_URL:
        //     sendResponse(window.location.href); // Get current page URL
        //     break;
        case ACTIONS.FIND_IFRAME_ACTION:
            const response = {
                iframeSrc: getIframeSrc(),
                currentPageUrl: window.location.href
            };
            sendResponse(response);
            break;
        case ACTIONS.GET_TARGET_LINKS:
            sendResponse(getTargetAHrefsBySelector(request.targetAHrefsUrl));
            break;
    }
});

// Get iframe src so as to go to new tab
function getIframeSrc() {
    const iframe = document.body.querySelector('iframe');
    iframe.style.border = '2px solid blue';
    console.log('iframe', iframe.src);
    return iframe.src;
}

// Get links for fetching
function getTargetAHrefsBySelector(currentPageUrl) {
    const selector = `a[href^="${currentPageUrl}"]`; // Selector for extracting products' links
    let targetAHrefsArr = [];
    document.body.querySelectorAll(selector).forEach(targetElement => {
        targetAHrefsArr.push(targetElement.getAttribute('href'));
    });
    console.log('links', targetAHrefsArr);
    return targetAHrefsArr;
}

