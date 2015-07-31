/**
 * @preserve Copyright Lolo_32 2015, All right reserved
 */
var myChat = myChat || {};
(function (document, navigator, localChat) {
    "use strict";

    var
        /**
         * @type {Object}
         */
        myChat = {},

        /**
         * @type {Element}
         */
        chatDiv;

    /**
     * Create a new element, with optioanl attributes
     * @param {string} tag
     * @param {Object} attribs
     * @param {string} [attribs.elemId] attribute id of the Element
     * @param {string} [attribs.cssClass] attribute class of the Element
     * @param {number} [attribs.len] attribute maxLength of the Element
     * @param {string} [attribs.attributeType] attribute type of the Element
     * @param {string} [attribs.attributeValue] attribute valut of the Element
     * @param {string} [attribs.autoComplete] can be 'on' or 'off' for autocomplete
     * @param {string} [attribs.html] innerHTML
     * @return {Element}
     */
    function createElem(tag, attribs) {
        /**
         * @type {Element}
         */
        var elem = document.createElement(tag);

        if (attribs.elemId) {
            elem.id = attribs.elemId;
        }
        if (attribs.cssClass) {
            elem.className = attribs.cssClass;
        }
        if (attribs.len) {
            elem.maxLength = attribs.len;
        }
        if (attribs.attributeType) {
            elem.type = attribs.attributeType;
        }
        if (attribs.attributeValue) {
            elem.value = attribs.attributeValue;
        }
        if (attribs.autoComplete) {
            elem.autocomplete = attribs.autoComplete;
        }
        if (attribs.html) {
            elem.innerHTML = attribs.html;
        }

        return elem;
    }

    /**
     * @param {Element} parent
     * @param {Element|Text} child
     */
    function addChild(parent, child) {
        parent.appendChild(child);
    }

    /**
     * return the DOM element by Id
     * @param {string} id
     * @returns {Element}
     */
    function getById(id) {
        return document.getElementById(id);
    }

    /**
     * return the DOM elements by class name
     * @param {string} cssClass
     * @returns {NodeList}
     */
    function getByClass(cssClass) {
        return document.getElementsByClassName(cssClass);
    }

    function doChat() {

        var
            /**
             * @const {string}
             */
            divUl = 'chatMessages',

            /**
             * @const {string}
             */
            divForm = 'chatForm',

            /**
             * @const {string}
             */
            divName = 'chatName',

            /**
             * @const {string}
             */
            divMessage = 'chatMsg',

            /**
             * @const {string}
             */
            divSend = 'chatSend';

        /**
         * Try to return the navigator language, fallback to myChat.locale if not found
         * @returns {string}
         */
        function getLocale() {
            if (navigator['language']) {
                return navigator['language'];
            }
            if (navigator['browserLanguage']) {
                return navigator['browserLanguage'];
            }
            if (navigator['systemLanguage']) {
                return navigator['systemLanguage'];
            }
            if (navigator['userLanguage']) {
                return navigator['userLanguage'];
            }
            return myChat.locale;
        }

        /**
         * Remove the HTML tags from the text
         * @param {string} text       the text to secure
         * @param {boolean} stripAll  if true, remove ALL tags, if false, preserve <b> and <i> tags
         * @returns {string}          the input text secured
         */
        function secureText(text, stripAll) {
            var regExp;
            if (stripAll) {
                regExp = /(?:<|\\x3c)[\w:\/\s="'\\\-]+?(?:>|\\x3e)/gi;
            } else {
                regExp = /(?:<|\\x3c)(?:\/?[ac-hj-z][\w:\/\s="'\\\.\-]+?|\/?[bi][\w:\/\s="'\\\.\-]+?)(?:>|\\x3e)/gi;
            }
            return text.replace(regExp, '');
        }

        /**
         * Replace the smileys in the text by their pictures
         * @param {string} text
         * @return {string}
         */
        function replaceSmiley(text) {
            var key, smileys = myChat.smileys, regExp, reg;
            for (key in smileys) {
                if (smileys.hasOwnProperty(key)) {
                    reg = key
                        .replace('.', '\\.').replace('\\', '\\\\')
                        .replace('*', '\\*').replace('+', '\\+')
                        .replace('(', '\\(').replace(')', '\\)')
                        .replace('[', '\\[').replace(']', '\\]')
                        .replace('{', '\\{').replace('}', '\\}');
                    regExp = new RegExp(reg, 'g');
                    text = text.replace(regExp, ('<img src="' + smileys[key]['url'] +
                        '" alt="' + key + '"' +
                        (smileys[key]['w'] ? (' width="' + smileys[key]['w'] + '"') : '') +
                        (smileys[key]['h'] ? (' height="' + smileys[key]['h'] + '"') : '') +
                        ' />'));
                }
            }
            return text;
        }

        /**
         * Create a message line
         * @param {(number|Date)} timestamp  timestamp in epoc
         * @param {string} name              pseudo
         * @param {string} msg               text written
         * @returns {Element}
         */
        function displayMessage(timestamp, name, msg) {
            var li, date, author, message, ts, localeNum = '2-digit';

            li = createElem('li', {cssClass: 'chatMessageLine'});

            timestamp = new Date(timestamp);
            ts = new Date();
            ts.setUTCDate(timestamp.getUTCDate());
            ts.setUTCFullYear(timestamp.getUTCFullYear());
            ts.setUTCHours(timestamp.getUTCHours());
            ts.setUTCMinutes(timestamp.getUTCMinutes());
            ts.setUTCMonth(timestamp.getUTCMonth());
            ts.setUTCSeconds(timestamp.getUTCSeconds());
            date = createElem('span', {
                cssClass: 'chatDate',
                html: ts.toLocaleString(getLocale(), {
//                    month:  localeNum,
//                    day:    localeNum,
                    hour:   localeNum,
                    minute: localeNum,
//                    second: localeNum
                }).replace(new RegExp(' ', 'g'), '&nbsp;')
            });

            author = createElem('span', {cssClass: 'chatAuthor', html: secureText(name, true)});

            message = createElem('span', {cssClass: 'chatMessage', html: replaceSmiley(secureText(msg, false))});

            addChild(li, date);
            addChild(li, author);
            addChild(li, message);

            return li;
        }

        /**
         * Function to call when socket.io is ready
         * Will try to connect to the server
         */
        function socketIoOk() {
            var
                socket = io(myChat.url),

                /**
                 * @type {Element}
                 */
                chatForm = getById(divForm),

                /**
                 * @type {Element}
                 */
                chatInput = getByClass(divMessage)[0],

                /**
                 * @type {Element}
                 */
                chatName = getByClass(divName)[0],

                /**
                 * @type {Element}
                 */
                chatMessages = getById(divUl);

            /**
             * Add the message to the beginning of the list
             * @param {{date: number, name: string, msg: string}} msg
             */
            function prependLi(msg) {
                chatMessages.insertBefore(displayMessage(msg['date'], msg['name'], msg['msg']), chatMessages.firstElementChild);
            }

            socket['emit']('join', myChat.session);
            socket['on']('reconnect', function () {
                socket['emit']('join', myChat.session);
            });

            // Listener on send message
            chatForm.addEventListener('submit', function (evt) {
                var msg = chatInput.value, name = chatName.value, data, date;
                evt.preventDefault();
                if (1 < msg.length && 1 < name.length) {
                    chatInput.value = '';
                    msg = msg.substring(0, 250);
                    name = name.substring(0, 30);
                    data = {
                        'msg':  msg,
                        'name': name
                    };
                    date = new Date();

                    socket['emit']('message', data);
                    prependLi({'date': date.valueOf(), 'name': name, 'msg': msg});
                }
            });

            // Event received when a message is received
            socket['on']('message', function (msg) {
                prependLi(msg);
            });

            // Event received normally on first connexion
            socket['on']('history', function (histo) {
                var length = histo.length, i;

                // Clean the old history (if any)
                while (chatMessages.hasChildNodes()) {
                    chatMessages.removeChild(chatMessages.childNodes[0]);
                }

                // Add the new history
                for (i = 0; i < length; ++i) {
                    prependLi(histo[i]);
                }
            });
        }

        /**
         * Wait that io() is ready to be used, then launch the connexion
         */
        function waitSocketIo() {
            if (typeof io === 'undefined') {
                setTimeout(waitSocketIo, 100);
            } else {
                setTimeout(socketIoOk, 100);
            }
        }

        /**
         * Create the chat interface
         */
        function createInterface() {
            var ul, form, name, nameDiv, text, textDiv, divLeft, divRight, send, sendDiv, smileys;

            ul = createElem('ul', {elemId: divUl});
            form = createElem('form', {elemId: divForm});
            name = createElem('input', {cssClass: divName, len: 30, autoComplete: 'on', attributeType: 'text'});
            smileys = createElem('input', {elemId: 'smileysButton', attributeType: 'button', attributeValue: 'Smileys'});
            smileys.onclick = function () {
                // Make a window, displaying all defined smileys

                function addSmiley(smiley, attrib) {
                    var div = createElem('div', {cssClass: 'smileyDiv'}),
                        img = createElem('img', {}),
                        br = createElem('br', {});
                    img.src = attrib['url'];
                    if (attrib['h']) {
                        img.height = parseInt(attrib['h'], 10);
                    }
                    if (attrib['w']) {
                        img.width = parseInt(attrib['w'], 10);
                    }
                    img.alt = smiley;
                    addChild(div, img);
                    addChild(div, br);
                    addChild(div, document.createTextNode(smiley));

                    return div;
                }

                function returnSmiley(key) {
                    var input = getByClass(divMessage)[0],
                        start = input.selectionStart,
                        stop = input.selectionEnd,
                        front = (input.value).slice(0, start),
                        back = (input.value).slice(stop),
                        scroll = input.scrollLeft;
                    input.value = front + key + back;
                    input.selectionStart = start + key.length;
                    input.selectionEnd = start + key.length;
                    input.scrollLeft = scroll;
                    input.focus();
                    smileyWindow.close();
                }

                var key, smiley, div, element,
                    smileyWindow = window.open('', 'Smileys', 'resizable=yes,scrollbars=yes,width=250,height=300'),
                    doc;
                if (smileyWindow) {
                    doc = smileyWindow.document;
                    if (!doc.head.hasChildNodes()) {
                        element = createElem('meta', {});
                        element.setAttribute('charset', 'UTF-8');
                        addChild(doc.head, element);
                        element = createElem('title', {});
                        addChild(element, document.createTextNode('Smileys'));
                        addChild(doc.head, element);
                        element = createElem('style', {});
                        addChild(element, document.createTextNode(myChat.cssSmiley || '.smileyDiv{text-align:center;padding:5px;margin:5px;float:left;border:dotted 1px;cursor:pointer;}'));
                        addChild(doc.head, element);
                        element = createElem('div', {elemId: 'divGeneral'});

                        for (key in myChat.smileys) {
                            if (myChat.smileys.hasOwnProperty(key)) {
                                smiley = myChat.smileys[key];
                                div = addSmiley(key, smiley);
                                div.onclick = (function () {
                                    var k = key;
                                    return function () {returnSmiley(k); };
                                }());
                                addChild(element, div);
                            }
                        }

                        addChild(doc.body, element);
                    }

                    if (smileyWindow.focus) {
                        smileyWindow.focus();
                    }
                }
            };

            send = createElem('input', {cssClass: divSend, attributeType: 'submit', attributeValue: myChat.sendText});
            sendDiv = createElem('div', {elemId: divSend});
            addChild(sendDiv, send);

            divRight = createElem('div', {elemId: 'divRight'});
            addChild(divRight, sendDiv);

            nameDiv = createElem('div', {elemId: divName});
            addChild(nameDiv, name);
            addChild(nameDiv, smileys);
            addChild(nameDiv, divRight);

            text = createElem('input', {cssClass: divMessage, len: 250, autoComplete: 'off', attributeType: 'text'});
            textDiv = createElem('div', {elemId: divMessage});
            addChild(textDiv, text);

//            divLeft = createElem('div', {elemId: 'divLeft'});
//            addChild(divLeft, nameDiv);
//            addChild(divLeft, textDiv);
            addChild(form, nameDiv);
            addChild(form, textDiv);

//            addChild(form, divLeft);
//            addChild(form, divRight);
            addChild(chatDiv, ul);
            addChild(chatDiv, form);
        }

        /**
         * Generate and add the <script> tag to the <head>
         */
        function loadScript() {
            var socketIoScript = createElem('script', {});

            socketIoScript.async = true;
            socketIoScript.src = 'https://cdn.socket.io/socket.io-1.3.5.js';
            addChild(document.getElementsByTagName('head')[0], socketIoScript);
        }

        // Generate and add the <script> tag to the <head>
        loadScript();

        // Create the divs that will be used later
        createInterface();

        // Wait that socket.io is available
        waitSocketIo();
    }

    function genSmileys() {
        function genObject(tab) {
            return {'url': ('http://croisic.baysse.fr/smileys/' + tab + '.gif')}; //, 'h': (tab[2] || localChat['smileyHeight']), 'w': (tab[3] || localChat['smileyWidth'])};
        }
        var i, smileyObj = {}, smileyTab = [
/*
            [':aliendanse:', 'g_danse.gif', '40px'],
            [':alienlaser:', 'g_laser.gif', '40px'],
            [':alienlove:', 'g_love.gif', '26px'],
            [':smoke:', 'g_smoke.gif', '36px'],
            [':wcareless:', 'l_careless.gif', '30px'],
            [':wcry:', 'l_cry.gif', '26px'],
            [':wdisturbed:', 'l_disturbed.gif', '26px'],
            [':wkiss:', 'l_kiss.gif', '26px'],
            [':wlaugh:', 'l_laugh.gif', '26px'],
            [':wlove:', 'l_love.gif', '26px'],
            [':wperv:', 'l_pervert.gif', '26px'],
            [':wtalisman:', 'l_talisman.gif', '26px'],
            [':wtired:', 'l_tired.gif', '26px'],
            [':aplus:', 'p_aplus.gif', '20px'],
            [':bienvenue:', 'p_welcome.gif', '77px'],
            [':bisous:', 'p_bisous.gif', '36px'],
            [':bonjour:', 'p_bonjour.gif', '38px'],
            [':connerie:', 'p_connerie.gif', '78px'],
            [':cool:', 'p_cool.gif', '22px'],
            [':corde:', 'p_corde.gif', '60px'],
            [':dehors:', 'p_dehors.gif', '50px'],
            [':iloveyou:', 'p_iloveyou.gif', '50px'],
            [':mdr:', 'p_mdr.gif', '45px'],
            [':sortie:', 'p_sortie.gif', '50px'],
            [':squate:', 'p_squate.gif', '46px'],
            [':sucette:', 'p_sucette.gif', '98px'],
            [':smack:', 'smack.gif', '24px'],
            [':bat:', 's_bat.gif', '30px'],
            [':bath:', 's_bath.gif', '32px'],
            [':cigar:', 's_cigar.gif', '28px'],
            [':clap:', 's_clap.gif', '28px'],
            [':computer:', 's_computer.gif', '32px'],
            [':cry:', 's_cry.gif'],
            [':devil:', 's_devil.gif', '20px'],
            [':diodon:', 's_diodon.gif'],
            [':down:', 's_down.gif', '22px'],
            [':up:', 's_up.gif', '22px'],
            [':drink:', 's_drink.gif', '20px'],
            [':drive:', 's_drive.gif'],
            [':flowers:', 's_flowers.gif'],
            [':gym:', 's_gym.gif', '28px'],
            [':indian:', 's_indian.gif', '28px'],
            [':irish:', 's_irish.gif', '24px'],
            [':kiss:', 's_kiss.gif'],
            [':lady:', 's_lady.gif', '22px'],
            [':laugh:', 's_laugh.gif'],
            [':love:', 's_love.gif'],
            [':negate:', 's_negate.gif'],
            [':no:', 's_no.gif'],
            [':plusone:', 's_plusone.gif', '22px'],
            [':reconciliation:', 's_reconciliation.gif'],
            [':roll:', 's_roll.gif', '22px'],
            [':sad:', 's_sad.gif'],
            [':sendkiss:', 's_sendkiss.gif', '30px'],
            [':tang:', 's_tang.gif', '20px'],
            [':tv:', 's_tv.gif'],
            [':unhappy:', 's_unhappy.gif', '26px']
*/
/*            ['aliendanse', 'g_danse'],
            ['alienlaser', 'g_laser'],
            ['alienlove', 'g_love'],
            ['smoke', 'g_smoke'],
            ['wcareless', 'l_careless'],
            ['wcry', 'l_cry'],
            ['wdisturbed', 'l_disturbed'],
            ['wkiss', 'l_kiss'],
            ['wlaugh', 'l_laugh'],
            ['wlove', 'l_love'],
            ['wperv', 'l_pervert'],
            ['wtalisman', 'l_talisman'],
            ['wtired', 'l_tired'],
            ['aplus', 'p_aplus'],
            ['bienvenue', 'p_welcome'],
            ['bisous', 'p_bisous'],
            ['bonjour', 'p_bonjour'],
            ['connerie', 'p_connerie'],
            ['cool', 'p_cool'],
            ['corde', 'p_corde'],
            ['dehors', 'p_dehors'],
            ['iloveyou', 'p_iloveyou'],
            ['mdr', 'p_mdr'],
            ['sortie', 'p_sortie'],
            ['squate', 'p_squate'],
            ['sucette', 'p_sucette'],
            ['smack', 'smack'],
            ['bat', 's_bat'],
            ['bath', 's_bath'],
            ['cigar', 's_cigar'],
            ['clap', 's_clap'],
            ['computer', 's_computer'],
            ['cry', 's_cry'],
            ['devil', 's_devil'],
            ['diodon', 's_diodon'],
            ['down', 's_down'],
            ['up', 's_up'],
            ['drink', 's_drink'],
            ['drive', 's_drive'],
            ['flowers', 's_flowers'],
            ['gym', 's_gym'],
            ['indian', 's_indian'],
            ['irish', 's_irish'],
            ['kiss', 's_kiss'],
            ['lady', 's_lady'],
            ['laugh', 's_laugh'],
            ['love', 's_love'],
            ['negate', 's_negate'],
            ['no', 's_no'],
            ['plusone', 's_plusone'],
            ['reconciliation', 's_reconciliation'],
            ['roll', 's_roll'],
            ['sad', 's_sad'],
            ['sendkiss', 's_sendkiss'],
            ['tang', 's_tang'],
            ['tv', 's_tv'],
            ['unhappy', 's_unhappy']
        ];
        for (i = 0; i < smileyTab.length; ++i) {
            smileyObj[':' + smileyTab[i][0] + ':'] = genObject(smileyTab[i]);
        }
*/
            '36candles',
            'anger',
            'anger2',
            'baby',
            'baseballbat',
            'bear',
            'bearlove',
            'bearslove',
            'blah',
            'bravo',
            'bye',
            'byebye',
            'cabug',
            'coaxing',
            'coffee',
            'computfight',
            'computstop',
            'coupdetete',
            'cry',
            'denounces',
            'drool',
            'embrace',
            'fight',
            'giftlove',
            'happylove',
            'hehe',
            'hellokitty',
            'hit',
            'hug',
            'hurray',
            'iloveyou',
            'inlove',
            'inlove2',
            'inlove3',
            'letaime',
            'jetm',
            'juggling',
            'kiss',
            'lol!',
            'lol',
            'lovebanana',
            'lover',
            'mdr!',
            'mdr',
            'meal',
            'mercenary',
            'no',
            'not',
            'ofcourse',
            'rainlove',
            'rose',
            'teddybear',
            'thankyou',
            'toast',
            'unhappy',
            'whiteflag',
            'wine',
            'wineparty',
            'wink'
        ];
        for (i = 0; i < smileyTab.length; ++i) {
            smileyObj[':' + smileyTab[i] + ':'] = genObject(smileyTab[i]);
        }
        return smileyObj;
    }

    // Initialize the parameters, use default option if not defined
    myChat.url =      localChat['url'];//      || 'ws://localhost:5465/';
    myChat.div =      localChat['div']      || 'chatDiv';
    myChat.locale =   localChat['locale']   || 'fr-FR';
    myChat.session =  localChat['session']  || document.baseURI;
    myChat.sendText = localChat['sendText'] || 'Send';
    myChat.smileys =  localChat['smileys']  || genSmileys();
    myChat.smileyH =  localChat['smileyHeight'];
    myChat.smileyW =  localChat['smileyWidth'];
    myChat.cssSmiley= localChat['cssSmiley'];

    if (!myChat.url) {
        return;
    }

    // Search for an element with id=chatDiv that will contain the chat
    chatDiv = getById(myChat.div);

    // Do nothing if it does not exist
    if (chatDiv) {

        doChat();
    }

}(document, navigator, myChat));
