    // iOS PWA Viewport-Fix: Simuliert das Neuladen des Bildschirms beim Start
    function fixIOSViewport() {
      const vh = window.innerHeight;
      document.documentElement.style.height = vh + 'px';
      document.body.style.height = vh + 'px';

      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.style.height = vh + 'px';
      }
    }

    // Bei Änderungen (wie Drehen) neu berechnen
    window.addEventListener('resize', fixIOSViewport);
    window.addEventListener('orientationchange', () => setTimeout(fixIOSViewport, 100));

    // Beim App-Start ausführen (mit leichten Verzögerungen für das träge iOS)
    fixIOSViewport();
    setTimeout(fixIOSViewport, 50);
    setTimeout(fixIOSViewport, 300);

// Blockiere das Standard-Kontextmenü, um Probleme beim Drag & Drop auf Android zu vermeiden
    window.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });

    // VOLLBILD-FUNKTION (Aktiviert beim ersten Tippen, aber NICHT als installierte App)
    document.body.addEventListener('click', function() {
      const isWindows = navigator.userAgent.includes('Windows');

      // NEU: Erkennt iPhones und iPads zuverlässig
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

      // NEU: Den Vollbild-Befehl nicht ausführen, wenn es ein iOS-Gerät ist
      if (!isWindows && !isIOS && !isStandalone && !document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(e => {});
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        }
      }
    }, { once: true });


    // Tab Logik
    const pagesList = ['page-home', 'page-search', 'page-mails', 'page-news', 'page-profil'];
    let currentIndex = 0;

    function switchTab(pageId, navElement) {
      // Wenn man bereits auf der ausgewählten Seite ist, Funktion sofort abbrechen
      if (document.getElementById(pageId).classList.contains('active')) return;

      document.querySelector('.navbar').style.display = 'flex'; // Stellt sicher, dass die Navbar sichtbar ist
      currentIndex = pagesList.indexOf(pageId);

      const pages = document.querySelectorAll('.page');
      pages.forEach(page => page.classList.remove('active'));

      document.getElementById(pageId).classList.add('active');

      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => item.classList.remove('active'));
      navElement.classList.add('active');

      // JS-Animationen und Layout-Anpassungen beim Wechsel zum Dashboard
      if (pageId === 'page-home') {
        // Roll-Animationen von vorne starten
        currentParkingSpots = 0;
        updateParkingDisplay(true);
        displayedMensaBalance = mensaBalance; // Reset to current value to avoid jump
        updateMensaBalance(true);

        updateScheduleProgress(true, true); // Stundenplan-Animation beim Tab-Wechsel triggern

        const activeRental = document.querySelector('#rental-views-container .rental-view.active');
        const viewport = document.getElementById('rental-views-viewport');
        if (activeRental && viewport && activeRental.offsetHeight > 0) {
          viewport.style.height = activeRental.offsetHeight + 'px';
        }
      } else if (pageId === 'page-news') {
        if (!window.newsLoaded) {
          loadNewsEvents();
          window.newsLoaded = true;
        }
      } else if (pageId === 'page-profil') {
        if (typeof updateStudyTimeDisplay === 'function') updateStudyTimeDisplay(true);
      }
    }

    // Wischen (Swipe) Logik
    let startX = 0;
    let startY = 0;
    const swipeArea = document.getElementById('swipe-area');

    swipeArea.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    swipeArea.addEventListener('touchend', e => {
      if (typeof dragState !== 'undefined' && (dragState.isDragging || dragState.wasDragging)) return; // Blockiert Seitenwechsel beim Sortieren

      let endX = e.changedTouches[0].clientX;
      let endY = e.changedTouches[0].clientY;
      let diffX = startX - endX;
      let diffY = startY - endY;

      // Nur wischen, wenn die horizontale Bewegung größer als die vertikale ist (verhindert Auslösen beim Scrollen)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 70) {
        if (diffX > 0) {
          if (currentIndex < pagesList.length - 1) {
            const nextId = pagesList[currentIndex + 1];
            const nextNav = document.querySelectorAll('.nav-item')[currentIndex + 1];
            switchTab(nextId, nextNav);
          }
        }
        else if (diffX < 0) {
          if (currentIndex > 0) {
            const prevId = pagesList[currentIndex - 1];
            const prevNav = document.querySelectorAll('.nav-item')[currentIndex - 1];
            switchTab(prevId, prevNav);
          }
        }
      }
    });

    // Wischen für Verleih-Widget
    const rentalWidget = document.getElementById('widget-rental');
    let rentalStartX = 0;
    let rentalStartY = 0;

    if (rentalWidget) {
      rentalWidget.addEventListener('touchstart', e => {
        rentalStartX = e.touches[0].clientX;
        rentalStartY = e.touches[0].clientY;
      }, { passive: true });

      rentalWidget.addEventListener('touchend', e => {
        if (typeof dragState !== 'undefined' && (dragState.isDragging || dragState.wasDragging)) return;

        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;
        let diffX = rentalStartX - endX;
        let diffY = rentalStartY - endY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          const booksBtn = rentalWidget.querySelector('.segment-btn[onclick*="books"]');
          const techBtn = rentalWidget.querySelector('.segment-btn[onclick*="tech"]');

          if (diffX > 0 && booksBtn.classList.contains('active')) {
            switchRentalView('tech', techBtn);
            e.stopPropagation(); // Verhindert Seitenwechsel, da intern gewischt wurde
          } else if (diffX < 0 && techBtn.classList.contains('active')) {
            switchRentalView('books', booksBtn);
            e.stopPropagation(); // Verhindert Seitenwechsel, da intern gewischt wurde
          }
        }
      });
    }

    // Wischen für Mails/iLearn-Ansicht
    const mailViewsWrapper = document.querySelector('.notification-views-wrapper');
    let mailStartX = 0;
    let mailStartY = 0;

    if (mailViewsWrapper) {
      mailViewsWrapper.addEventListener('touchstart', e => {
        const mailPage = document.getElementById('page-mails');
        if (mailPage && mailPage.classList.contains('selection-mode')) return; // Swipen beim Auswählen blockieren
        mailStartX = e.touches[0].clientX;
        mailStartY = e.touches[0].clientY;
      }, { passive: true });

      mailViewsWrapper.addEventListener('touchend', e => {
        const mailPage = document.getElementById('page-mails');
        if (mailPage && mailPage.classList.contains('selection-mode')) return;
        if (typeof isDraggingSelection !== 'undefined' && isDraggingSelection) return;

        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;
        let diffX = mailStartX - endX;
        let diffY = mailStartY - endY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          const mailSegments = document.getElementById('mail-segments');
          const mailsBtn = mailSegments.querySelector('.segment-btn[onclick*="mails"]');
          const ilearnBtn = mailSegments.querySelector('.segment-btn[onclick*="ilearn"]');

          if (diffX > 0 && mailsBtn.classList.contains('active')) {
            switchNotificationView('ilearn', ilearnBtn);
            e.stopPropagation(); // Verhindert allgemeinen Seitenwechsel
          } else if (diffX < 0 && ilearnBtn.classList.contains('active')) {
            switchNotificationView('mails', mailsBtn);
            e.stopPropagation(); // Verhindert allgemeinen Seitenwechsel
          }
        }
      });
    }

    function ensureMailIds() {
      document.querySelectorAll('.mail-item').forEach((item, index) => {
        if (!item.hasAttribute('data-mail-id')) {
          item.setAttribute('data-mail-id', 'mail-' + Date.now() + '-' + Math.floor(Math.random() * 10000) + '-' + index);
        }
      });
    }

    async function loadNewsEvents() {
      const listContainer = document.getElementById('news-list');
      if (!listContainer) return;

      let eventsData = [];
      let useCache = false;
      let isStale = false;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const renderList = (dataToRender) => {
        listContainer.innerHTML = '';
        let validEvents = dataToRender.filter(e => e.start >= now).sort((a, b) => a.start - b.start);

        if (validEvents.length === 0) {
          listContainer.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 20px;">Keine anstehenden Termine gefunden.</div>';
          return;
        }

        const monthsLoc = {
            de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
            en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            fi: ['Tam', 'Hel', 'Maa', 'Huh', 'Tou', 'Kes', 'Hei', 'Elo', 'Syy', 'Lok', 'Mar', 'Jou']
        };

        validEvents.forEach(event => {
          const day = String(event.start.getDate()).padStart(2, '0');
          const monthArr = monthsLoc[currentLanguage] || monthsLoc['de'];
          const month = monthArr[event.start.getMonth()];

          let timeStr = "";
          if (event.start.getHours() !== 0 || event.start.getMinutes() !== 0) {
              const sh = String(event.start.getHours()).padStart(2, '0');
              const sm = String(event.start.getMinutes()).padStart(2, '0');
              let timeSuffix = currentLanguage === 'en' ? 'h' : (currentLanguage === 'fi' ? '' : ' Uhr');
              timeStr = `${sh}:${sm} ${timeSuffix}`.trim();

              if (event.end && (event.end.getHours() !== 0 || event.end.getMinutes() !== 0)) {
                  const eh = String(event.end.getHours()).padStart(2, '0');
                  const em = String(event.end.getMinutes()).padStart(2, '0');
                  timeStr = `${sh}:${sm} - ${eh}:${em} ${timeSuffix}`.trim();
              }
          } else {
              timeStr = currentLanguage === 'en' ? 'All day' : (currentLanguage === 'fi' ? 'Koko päivä' : 'Ganztägig');
          }

          const isFav = favoriteEvents.has(event.id);
          const card = document.createElement('div');
          card.className = 'list-item news-item' + (isFav ? ' is-favorite' : '');
          card.style.cssText = 'flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; margin: 0; isolation: isolate; position: relative; background-color: var(--card-bg); border-radius: 16px; cursor: pointer;';
          card.onclick = () => openEventModal(event.summary, timeStr, event.location, event.description, event.id);

          let locHtml = event.location ? `<div style="color: var(--text-sub); font-size: 13px; display: flex; align-items: center; gap: 6px; margin-top: 4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${event.location}</span></div>` : '';
          let descHtml = event.description ? `<div style="color: var(--text-sub); font-size: 13px; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">${event.description}</div>` : '';

          card.innerHTML = `
             <div style="display: flex; gap: 15px; width: 100%; align-items: flex-start;">
                <div style="background: rgba(58, 130, 247, 0.15); color: var(--accent-blue); border: 1.5px solid rgba(58, 130, 247, 0.3); border-radius: 12px; padding: 10px 8px; text-align: center; min-width: 58px; box-sizing: border-box; flex-shrink: 0; margin-top: 2px;"><div style="font-size: 22px; font-weight: 700; line-height: 1;">${day}</div><div style="font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 4px;">${month}</div></div>
                <div style="flex: 1; min-width: 0;">
                   <div style="display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; width: 100%;"><div style="font-weight: 600; font-size: 15px; color: var(--text-main); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; flex: 1;">${event.summary}</div><div class="event-star ${isFav ? 'active' : ''}" onclick="toggleEventFavorite('${event.id}', event, this)" style="flex-shrink: 0; padding: 2px; cursor: pointer; margin-top: -2px; margin-right: -2px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div></div>
                   <div style="color: var(--accent-blue); font-size: 13px; font-weight: 600; margin-top: 6px;">${timeStr}</div>
                   ${locHtml}${descHtml}
                </div>
             </div>
          `;
          listContainer.appendChild(card);
        });
        checkEmptyFavorites();
      };

      if (!isRealModeEnabled) {
        eventsData = [
            { id: 'demo1', summary: 'Campusfest 2024', start: new Date(now.getTime() + 86400000 * 2 + 3600000*16), end: new Date(now.getTime() + 86400000 * 2 + 3600000*22), location: 'Campus Innenhof', description: 'Das jährliche Campusfest mit Live-Musik, Foodtrucks und kühlen Getränken. Alle Studierenden sind herzlich eingeladen!' },
            { id: 'demo2', summary: 'Karrieremesse First Contact', start: new Date(now.getTime() + 86400000 * 5 + 3600000*10), end: new Date(now.getTime() + 86400000 * 5 + 3600000*15), location: 'Deggendorfer Stadthallen', description: 'Die Firmenkontaktmesse der THD. Lerne regionale und überregionale Unternehmen kennen und knüpfe Kontakte für Praktika und Berufseinstieg.' },
            { id: 'demo3', summary: 'Gastvortrag: KI in der Medienproduktion', start: new Date(now.getTime() + 86400000 * 8 + 3600000*14), end: new Date(now.getTime() + 86400000 * 8 + 3600000*16), location: 'Glashaus (J-Gebäude)', description: 'Ein spannender Einblick in die Nutzung von künstlicher Intelligenz in modernen Film- und Audioproduktionen. Gastreferent: Max Mustermann (Pixar).' },
            { id: 'demo4', summary: 'Wochenend-Workshop: Unity 3D', start: new Date(now.getTime() + 86400000 * 12 + 3600000*9), end: new Date(now.getTime() + 86400000 * 14 + 3600000*17), location: 'ITC2 Raum 1.05', description: 'Intensivkurs für Einsteiger in die Spieleentwicklung mit Unity. Anmeldung über iLearn erforderlich.' },
            { id: 'demo5', summary: 'Kinoabend des AStA', start: new Date(now.getTime() + 86400000 * 15 + 3600000*19), end: new Date(now.getTime() + 86400000 * 15 + 3600000*22), location: 'Hörsaal B004', description: 'Wir zeigen den Klassiker "The Big Lebowski". Für Popcorn und Getränke ist gesorgt (gegen Spende).' }
        ];
      } else {
        if (isStorageEnabled()) {
          const cachedNews = localStorage.getItem('thd_news_cache');
          if (cachedNews) {
            try {
              const parsed = JSON.parse(cachedNews);
              if (parsed.events.every(e => e.description !== undefined)) {
                eventsData = parsed.events.map(e => ({
                  ...e,
                  start: new Date(e.start),
                  end: e.end ? new Date(e.end) : null
                }));
                useCache = true;

                if (Date.now() - parsed.timestamp >= 3600000) {
                  isStale = true; // Cache ist abgelaufen, aber wir zeigen ihn trotzdem sofort
                }
              }
            } catch(e) {}
          }
        }

        if (useCache) {
            renderList(eventsData);
        }

        if (!useCache || isStale) {
          try {
            const targetUrl = encodeURIComponent('https://th-deg.de/de/studierende/campusleben/veranstaltungskalender');
            if (!useCache) listContainer.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 20px;">Lade Termine...</div>';
          const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + targetUrl;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Netzwerkfehler: ${response.status}`);

        const htmlString = await response.text();

        // Nutze DOMParser anstelle von simplem Regex, um den echten Titel auslesen zu können
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const eventLinks = doc.querySelectorAll('a[href*="veranstaltung?id="]');
        const seenIds = new Set();

        eventLinks.forEach(link => {
          const href = link.getAttribute('href');
          const match = href.match(/id=(\d+)/);
          if (match) {
            const id = match[1];

            // Textinhalt säubern (entfernt überflüssige Leerzeichen & HTML-Tags)
            let title = link.textContent.trim().replace(/\s+/g, ' ');

            // Herausfiltern von Kalender-Tagen (die nur aus Zahlen bestehen) oder komplett leeren Links
            if (title !== '' && !/^\d+$/.test(title) && !seenIds.has(id)) {
              seenIds.add(id);
            }
          }
        });

        // Wir nehmen alle gefundenen IDs, arbeiten sie aber in kleinen Schritten ab.
        // So finden wir garantiert die zukünftigen Termine.
        const idArray = Array.from(seenIds);

        if (idArray.length === 0) {
          if (!useCache) listContainer.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 20px;">Keine Termine gefunden.</div>';
          return;
        }

        if (!useCache) {
            listContainer.innerHTML = '<div style="color: var(--text-sub); text-align: center; padding: 20px;">Lese Kalender-Daten...</div>';
        }

        let upcomingCount = 0;
        eventsData = []; // Reset eventsData for fresh fetch

        // In 6er-Schritten herunterladen, um den Proxy nicht zu überlasten
        for (let i = 0; i < idArray.length; i += 6) {
            const chunk = idArray.slice(i, i + 6);
            const promises = chunk.map(async (id) => {
                try {
                    const iCalUrl = `https://th-deg.de/de/ical-export?eventid=${id}`;
                    const iCalProxy = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(iCalUrl);
                    const res = await fetch(iCalProxy);
                    if (!res.ok) return null;
                    const text = await res.text();

                    let start = null, end = null, location = "", summary = "", description = "";
                    let currentKey = "";

                    const foldedText = text.replace(/\r?\n[ \t]/g, '');
                    const lines = foldedText.split('\n');

                    lines.forEach(line => {
                        line = line.trim();
                        if (!line) return;

                        const matchKey = line.match(/^([A-Z-]+)([:;])/);
                        if (matchKey) {
                            currentKey = matchKey[1];
                            const value = line.substring(line.indexOf(':') + 1).replace(/\\,/g, ',');

                            if (currentKey === 'SUMMARY') summary = value;
                            else if (currentKey === 'LOCATION') location = value;
                            else if (currentKey === 'DESCRIPTION') description = value;
                            else if (currentKey === 'DTSTART') {
                                const matchTime = line.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
                                if (matchTime) {
                                    start = new Date(matchTime[1], matchTime[2]-1, matchTime[3], matchTime[4], matchTime[5]);
                                    if(line.includes('Z')) start.setHours(start.getHours() + (start.getTimezoneOffset() / -60));
                                } else {
                                    const matchDate = line.match(/(\d{4})(\d{2})(\d{2})/);
                                    if (matchDate) start = new Date(matchDate[1], matchDate[2]-1, matchDate[3]);
                                }
                            }
                            else if (currentKey === 'DTEND') {
                                const matchTime = line.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
                                if (matchTime) {
                                    end = new Date(matchTime[1], matchTime[2]-1, matchTime[3], matchTime[4], matchTime[5]);
                                    if(line.includes('Z')) end.setHours(end.getHours() + (end.getTimezoneOffset() / -60));
                                } else {
                                    const matchDate = line.match(/(\d{4})(\d{2})(\d{2})/);
                                    if (matchDate) end = new Date(matchDate[1], matchDate[2]-1, matchDate[3]);
                                }
                            }
                        } else {
                            if (currentKey === 'DESCRIPTION') description += ' ' + line;
                            else if (currentKey === 'SUMMARY') summary += ' ' + line;
                        }
                    });

                    if (!start || !summary) return null;

                    let cleanDesc = description
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                        .replace(/<br\s*\/?>/gi, ' ')
                        .replace(/<\/p>/gi, ' ')
                        .replace(/<[^>]*>?/gm, '')
                        .replace(/\\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    return { id, summary, start, end, location, description: cleanDesc };
                } catch (e) {
                    return null;
                }
            });

            const results = await Promise.all(promises);
            const validEvents = results.filter(e => e !== null);

            validEvents.forEach(e => {
                if (e.start >= now) upcomingCount++;
                eventsData.push(e);
            });

            // Aufhören, sobald wir mindestens 8 zukünftige Termine gefunden haben
            if (upcomingCount >= 8) break;
        }

        if (isStorageEnabled() && eventsData.length > 0) {
            localStorage.setItem('thd_news_cache', JSON.stringify({
                timestamp: Date.now(),
                events: eventsData
            }));
        }

        renderList(eventsData);

        } catch (error) {
          console.error('Fehler beim Laden der News:', error);
          if (!useCache) listContainer.innerHTML = '<div style="color: #FF3B30; text-align: center; padding: 20px;">Fehler beim Laden der Termine.</div>';
          return;
        }
      }
      }
    }


    function toggleEventFavorite(id, e, btn) {
        e.stopPropagation(); // Verhindert, dass das Popup geöffnet wird
        const card = btn.closest('.news-item');

        if (favoriteEvents.has(id)) {
            favoriteEvents.delete(id);
            btn.classList.remove('active');
            if (card) card.classList.remove('is-favorite');
        } else {
            favoriteEvents.add(id);
            btn.classList.add('active');
            if (card) card.classList.add('is-favorite');
        }

        if (isStorageEnabled()) saveAllData();
        checkEmptyFavorites();
    }

    function toggleEventFilter(btn) {
        isFavoritesFilterActive = !isFavoritesFilterActive;
        const list = document.getElementById('news-list');

        if (isFavoritesFilterActive) {
            btn.classList.add('active-filter');
            if (list) list.classList.add('favorites-only');
        } else {
            btn.classList.remove('active-filter');
            if (list) list.classList.remove('favorites-only');
        }
        checkEmptyFavorites();
    }

    function checkEmptyFavorites() {
        const list = document.getElementById('news-list');
        const msg = document.getElementById('no-favorites-msg');
        if (!list || !msg) return;

        if (isFavoritesFilterActive) {
            const hasVisibleFavs = list.querySelectorAll('.news-item.is-favorite').length > 0;
            if (!hasVisibleFavs) {
                msg.style.display = 'block';
            } else {
                msg.style.display = 'none';
            }
        } else {
            msg.style.display = 'none';
        }
    }

    function initMailTimestamps() {
      const now = Date.now();
      document.querySelectorAll('.mail-time').forEach(el => {
        if (!el.hasAttribute('data-timestamp')) {
          const text = el.innerText.trim();
          if (text === 'Gerade eben' || text === 'Just now' || text === 'Juuri nyt') {
            el.setAttribute('data-timestamp', now);
          } else if (text === 'Vor 5 Min' || text.includes('5 min')) {
            el.setAttribute('data-timestamp', now - 5 * 60000);
          } else if (text === 'Gestern' || text === 'Yesterday' || text === 'Eilen') {
            el.setAttribute('data-timestamp', now - 24 * 3600000);
          }
        }
      });
    }

    function updateRelativeTimes() {
      const now = Date.now();
      document.querySelectorAll('.mail-time[data-timestamp]').forEach(el => {
        const timestamp = parseInt(el.getAttribute('data-timestamp'), 10);
        if (isNaN(timestamp)) return;

        const diffMs = now - timestamp;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let text = "";
        if (diffMins < 1) text = translations[currentLanguage].just_now;
        else if (diffMins < 60) text = (translations[currentLanguage].time_mins_ago || "Vor {n} Min").replace('{n}', diffMins);
        else if (diffHours < 24) text = (translations[currentLanguage].time_hours_ago || "Vor {n} Std").replace('{n}', diffHours);
        else if (diffDays === 1) text = translations[currentLanguage].time_yesterday || "Gestern";
        else text = (translations[currentLanguage].time_days_ago || "Vor {n} Tagen").replace('{n}', diffDays);

        el.innerText = text;
      });
    }

    function initHeaderEasterEgg() {
      document.querySelectorAll('.header > span[data-translate]').forEach(headerSpan => {
        headerSpan.addEventListener('click', () => {
          if (headerSpan.classList.contains('header-pop-in')) return;

          // Wenn der Text noch nicht in Buchstaben aufgeteilt ist, jetzt machen.
          if (!headerSpan.classList.contains('is-letterized')) {
            const originalText = headerSpan.innerText;
            headerSpan.setAttribute('data-original-text', originalText);
            headerSpan.innerHTML = '';

            originalText.split('').forEach(char => {
              const letterSpan = document.createElement('span');
              letterSpan.className = 'header-letter';
              letterSpan.innerText = char === ' ' ? '\u00A0' : char;
              headerSpan.appendChild(letterSpan);
            });

            headerSpan.classList.add('is-letterized');
          }

          // Finde den nächsten Buchstaben, der wegfliegen soll (wird jetzt auch beim ersten Klick ausgeführt)
          const letters = Array.from(headerSpan.querySelectorAll('.header-letter:not(.flown-away)'));

          if (letters.length > 0) {
            const letterToFly = letters[letters.length - 1];
            letterToFly.classList.add('letter-fly-away', 'flown-away');

            // Animation-Klasse nach Abschluss entfernen, damit sie beim Tab-Wechsel nicht neu startet
            setTimeout(() => {
              letterToFly.classList.remove('letter-fly-away');
              letterToFly.style.opacity = '0';
            }, 600);

            // Wenn es der letzte Buchstabe war, alles zurücksetzen
            if (letters.length === 1) {
              setTimeout(() => {
                headerSpan.innerHTML = headerSpan.getAttribute('data-original-text');
                headerSpan.classList.remove('is-letterized');
                headerSpan.classList.add('header-pop-in');

                setTimeout(() => {
                  headerSpan.classList.remove('header-pop-in');
                }, 400);
              }, 600);
            }
          }
        });
      });
    }

    function saveMensaCache() {
      if (isStorageEnabled()) {
        localStorage.setItem('thd_mensa_cache', JSON.stringify({ timestamp: Date.now(), data: mensaDataCache }));
      }
    }

    async function loadRealMensaData(forceRefresh = false) {
      try {
        // 1. Mensa ID für Deggendorf (hartkodiert für schnellere Ladezeit)
        const mensaId = 198;

        // 2. Datum von heute formatieren (YYYY-MM-DD)
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const today = now.toISOString().split('T')[0];

        let meals = null;

        const emptyText = translations[currentLanguage].mensa_no_menu;
        const btnText = translations[currentLanguage].mensa_to_menu;
        const emptyHtml = `
            <div data-translate="mensa_no_menu" style="display: flex; justify-content: center; padding: 12px; font-size: 13px; font-weight: 500; color: var(--text-sub); pointer-events: none;">${emptyText}</div>
            <div class="list-item" onclick="openMensaMenuModal(true)" style="background-color: rgba(58, 130, 247, 0.15); border: 1.5px solid rgba(58, 130, 247, 0.3); box-sizing: border-box; justify-content: center; cursor: pointer; color: var(--accent-blue);">
                <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <span data-translate="mensa_to_menu">${btnText}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </div>
        `;

        if (typeof mensaDataCache !== 'undefined' && mensaDataCache[today]) {
            meals = mensaDataCache[today];
        }

        if (!meals || forceRefresh) {
            // 3. Speiseplan für heute abrufen
            const mealsRes = await fetch(`https://openmensa.org/api/v2/canteens/${mensaId}/days/${today}/meals`);

            // Falls heute zu ist (Wochenende/Feiertag), wirft die API einen 404 Fehler
            if (!mealsRes.ok) {
                if (!meals) document.querySelector('#widget-mensa .scroll-list').innerHTML = emptyHtml;
                return;
            }

            meals = await mealsRes.json();
            if (typeof mensaDataCache !== 'undefined') {
                mensaDataCache[today] = meals;
                saveMensaCache();
            }
        }

        // 4. HTML in deinem Widget aktualisieren
        const listContainer = document.querySelector('#widget-mensa .scroll-list');
        listContainer.innerHTML = ''; // Alte Dummy-Daten löschen

        if (meals.length === 0) {
            listContainer.innerHTML = emptyHtml;
            return;
        }

        // 6. Jedes Gericht in das kleine Widget einfügen
        meals.forEach(meal => {
            // Preis für Studierende auslesen und formatieren (z.B. 2.3 -> "2,30€")
            let priceText = "-";
            if (meal.prices && meal.prices.students !== null) {
                priceText = meal.prices.students.toFixed(2).replace('.', ',') + '€';
            }

            // Neues Listen-Element (Kachel) erstellen
            const itemDiv = document.createElement('div');
            itemDiv.className = 'list-item';
            itemDiv.style.cursor = 'pointer';

            // Klick auf das kleine Widget öffnet jetzt wieder die Gesamt-Übersicht!
            itemDiv.onclick = openMensaMenuModal;

            // HTML-Struktur der Zeile aufbauen
            itemDiv.innerHTML = `<span>${meal.name}</span><span class="item-value">${priceText}</span>`;

            // Rausch-Textur für dein Design hinzufügen
            itemDiv.style.position = 'relative';
            itemDiv.style.isolation = 'isolate';

            listContainer.appendChild(itemDiv);
        });

      } catch (error) {
        console.error("Fehler beim Laden der Mensa-Daten:", error);
        const errorText = translations[currentLanguage].mensa_error;
        const btnText = translations[currentLanguage].mensa_to_menu;
        document.querySelector('#widget-mensa .scroll-list').innerHTML = `
            <div data-translate="mensa_error" style="display: flex; justify-content: center; padding: 12px; font-size: 13px; font-weight: 500; color: #FF3B30; pointer-events: none;">${errorText}</div>
            <div class="list-item" onclick="openMensaMenuModal(true)" style="background-color: rgba(58, 130, 247, 0.15); border: 1.5px solid rgba(58, 130, 247, 0.3); box-sizing: border-box; justify-content: center; cursor: pointer; color: var(--accent-blue);">
                <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <span data-translate="mensa_to_menu">${btnText}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </div>
        `;
      }
    }

    async function loadSchedule() {
      const scheduleBox = document.getElementById('widget-schedule');
      if (!scheduleBox) return;

      // CACHE BUSTER: Zwingt den Proxy dazu, immer die allerneueste Datei von der Hochschule zu holen
      const iCalLink = 'https://thabella.th-deg.de/thabella/opn/event/calendarStudentSubscribe?group=' + currentStudyGroup + '&cb=' + Date.now();

      // WICHTIG: Die URL codieren, sonst schneidet der Proxy alles nach dem ? oder & ab
      const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(iCalLink);

      try {
        let text = null;
        let needsFetch = true;
        const cachedSchedule = isStorageEnabled() ? localStorage.getItem('thd_schedule_cache') : null;

        if (cachedSchedule) {
            try {
                const parsed = JSON.parse(cachedSchedule);
                if (parsed.group === currentStudyGroup) {
                    text = parsed.text;
                    if (Date.now() - parsed.timestamp < 3600000) {
                        needsFetch = false;
                    }
                }
            } catch(e) {}
        }

        if (text) {
            parseScheduleText(text);
        }

        if (needsFetch) {
            if (!text && (!window.allScheduleEvents || window.allScheduleEvents.length === 0)) {
                scheduleBox.innerHTML = '<div class="schedule-item"><div class="schedule-title" style="color: var(--accent-blue);">Lade Stundenplan...</div></div>';
            }
            const res = await fetch(proxyUrl);
            if (!res.ok) {
              throw new Error(`Netzwerkfehler: ${res.status}`);
            }
            const newText = await res.text();
            if (isStorageEnabled() && newText && newText.includes('BEGIN:VCALENDAR')) {
                localStorage.setItem('thd_schedule_cache', JSON.stringify({ timestamp: Date.now(), text: newText, group: currentStudyGroup }));
            }
            if (newText && newText !== text) {
                parseScheduleText(newText);
            }
        }

        const savedIlearnHtml = localStorage.getItem('thd_ilearn_html');
        if (savedIlearnHtml !== null) {
            const ilearnViewList = document.querySelector('#ilearn-view .mail-list');
            if (ilearnViewList) {
                ilearnViewList.innerHTML = savedIlearnHtml;
                const ilearnItems = ilearnViewList.querySelectorAll('.mail-item');
                ilearnItems.forEach(item => attachMailEventListeners(item));
                updateUnreadBadge();
            }
        }

        const savedWidgetVisibility = localStorage.getItem('thd_widget_visibility');
        if (savedWidgetVisibility) {
            try {
                const vis = JSON.parse(savedWidgetVisibility);
                for (const [id, isVisible] of Object.entries(vis)) {
                    const checkbox = document.querySelector(`input[onchange*="'${id}'"]`);
                    if (checkbox) {
                        checkbox.checked = isVisible;
                        if (typeof toggleWidget === 'function') {
                            toggleWidget(id, checkbox, false);
                        }
                    }
                }
            } catch(e) {}
        }

        const savedVpnState = localStorage.getItem('thd_vpn_state');
        if (savedVpnState !== null) {
            const vpnToggle = document.getElementById('vpn-toggle');
            const vpnStatusText = document.getElementById('vpn-status-text');
            if (vpnToggle && vpnStatusText) {
                vpnToggle.checked = savedVpnState === 'true';
                if (vpnToggle.checked) {
                    vpnStatusText.innerText = translations[currentLanguage].vpn_status_connected;
                    vpnStatusText.setAttribute('data-translate', 'vpn_status_connected');
                    vpnStatusText.classList.add('active');
                } else {
                    vpnStatusText.innerText = translations[currentLanguage].vpn_status_disconnected;
                    vpnStatusText.setAttribute('data-translate', 'vpn_status_disconnected');
                    vpnStatusText.classList.remove('active');
                }
            }
        }

        // Widget mit den neuen Daten aktualisieren
        updateScheduleWidget(true);

      } catch (err) {
        console.error('Fehler beim Stundenplan:', err);
        if (!window.allScheduleEvents || window.allScheduleEvents.length === 0) {
            scheduleBox.innerHTML = '<div class="schedule-item"><div class="schedule-title" style="color: #FF3B30;">Verbindungsfehler</div></div>';
        }
      }
    }

    function parseScheduleText(calText) {
        if (!calText || !calText.includes('BEGIN:VCALENDAR')) return;
        const events = [];
        const unfoldedText = calText.replace(/\r?\n[ \t]/g, '');
        const lines = unfoldedText.split('\n');
        let currentEvent = {};

        lines.forEach(line => {
          line = line.trim();
          if (line.startsWith('BEGIN:VEVENT')) currentEvent = {};

          if (line.startsWith('SUMMARY:') || line.startsWith('SUMMARY;')) currentEvent.title = line.substring(line.indexOf(':') + 1).replace(/\\,/g, ',');
          if (line.startsWith('LOCATION:') || line.startsWith('LOCATION;')) currentEvent.room = line.substring(line.indexOf(':') + 1).replace(/\\,/g, ',');

          if (line.startsWith('DTSTART')) {
             const match = line.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
             if(match) {
                 currentEvent.start = `${match[4]}:${match[5]}`;
                 const eventDate = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), parseInt(match[4], 10), parseInt(match[5], 10));
                 if(line.includes('Z')) {
                     eventDate.setHours(eventDate.getHours() + (eventDate.getTimezoneOffset() / -60));
                     currentEvent.start = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
                 }
                 let day = eventDate.getDay() - 1;
                 if (day < 0) day = 6;
                 currentEvent.day = day;
                 currentEvent.dateObj = eventDate;
             }
          }
          if (line.startsWith('DTEND')) {
             const match = line.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
             if(match) {
                 currentEvent.end = `${match[4]}:${match[5]}`;
                 const endDateObj = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), parseInt(match[4], 10), parseInt(match[5], 10));
                 if(line.includes('Z')) {
                     endDateObj.setHours(endDateObj.getHours() + (endDateObj.getTimezoneOffset() / -60));
                     currentEvent.end = `${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}`;
                 }
                 currentEvent.endDateObj = endDateObj;
             }
          }
          if (line.startsWith('END:VEVENT')) {
            if(currentEvent.title && currentEvent.dateObj) {
              if (!currentEvent.end || !currentEvent.endDateObj) {
                const fallbackEnd = new Date(currentEvent.dateObj.getTime() + 90 * 60000);
                currentEvent.endDateObj = fallbackEnd;
                currentEvent.end = `${String(fallbackEnd.getHours()).padStart(2, '0')}:${String(fallbackEnd.getMinutes()).padStart(2, '0')}`;
              }
              events.push(currentEvent);
            }
          }
        });

        window.allScheduleEvents = events;
        if (document.getElementById('schedule-modal').classList.contains('show')) {
            updateScheduleModalView();
        }
        updateScheduleWidget(true);
    }

    // Initiale Setup-Logik für Slider
    window.addEventListener('DOMContentLoaded', () => {
      // Originale Dummy-Daten sichern, falls der Real-Mode später deaktiviert wird
      const mensaList = document.querySelector('#widget-mensa .scroll-list');
      if (mensaList) dummyMensaHTML = mensaList.innerHTML;
      const scheduleBox = document.getElementById('widget-schedule');
      if (scheduleBox) dummyScheduleHTML = scheduleBox.innerHTML;

      // Wecke das kostenlose Render-Backend lautlos im Hintergrund auf (Cold Start umgehen)
      fetch('https://thd-app-backend.onrender.com/').catch(() => {});

      // Helper-Funktion: Verhindert, dass ein klassisches Raster-Mausrad am PC Elemente überspringt
      function fixMouseWheelSnapping(widgetId, itemHeight) {
          const widget = document.getElementById(widgetId);
          if (!widget) return;

          let isWheeling = false;
          let scrollEndTimer = null;

          // Dieser Listener erkennt, wenn das 'smooth' Scrollen beendet ist.
          widget.addEventListener('scroll', () => {
              // Nur reagieren, wenn wir das Scrollen selbst ausgelöst haben
              if (!isWheeling) return;

              clearTimeout(scrollEndTimer);
              scrollEndTimer = setTimeout(() => {
                  // Wenn 150ms nichts passiert, ist das Scrollen vorbei.
                  isWheeling = false;
              }, 150);
          });

          widget.addEventListener('wheel', (e) => {
              // Trackpads und weiche Scrollräder senden oft kleine oder ungerade deltaY Werte.
              // Raster-Mausräder (Windows) senden meist größere Ganzzahlen (z.B. 100, 120, 53).
              if (Math.abs(e.deltaY) < 20 || e.deltaY % 1 !== 0) return;

              e.preventDefault();

              // Ignoriere neue Mausrad-Events, während eine Animation läuft.
              if (isWheeling) return;

              const direction = Math.sign(e.deltaY);
              const currentIndex = Math.round(widget.scrollTop / itemHeight);
              let targetTop = (currentIndex + direction) * itemHeight;

              // Verhindert das Hängenbleiben an den Rändern (vermeidet unnötigen scrollTo-Aufruf)
              const maxScroll = widget.scrollHeight - widget.clientHeight;
              targetTop = Math.max(0, Math.min(targetTop, maxScroll));

              if (Math.abs(widget.scrollTop - targetTop) < 1) return;

              isWheeling = true;

              // Sicherheits-Fallback, falls das Scroll-Event verschluckt wird
              clearTimeout(scrollEndTimer);
              scrollEndTimer = setTimeout(() => isWheeling = false, 400);

              widget.scrollTo({ top: targetTop, behavior: 'smooth' });
          }, { passive: false });
      }
      fixMouseWheelSnapping('widget-ects', 150);
      fixMouseWheelSnapping('widget-schedule', 80); // 68px Höhe + 12px Gap

      setTimeout(() => {
        const activeRental = document.querySelector('#rental-views-container .rental-view.active');
        const viewport = document.getElementById('rental-views-viewport');
        if (activeRental && viewport) {
          viewport.style.height = activeRental.offsetHeight + 'px';
        }
      }, 50);

    const widgetEcts = document.getElementById('widget-ects');
    if (widgetEcts) {
      widgetEcts.addEventListener('scroll', () => {
        clearTimeout(window.ectsScrollTimeout);
        window.ectsScrollTimeout = setTimeout(() => {
          if (isStorageEnabled()) {
            const index = Math.round(widgetEcts.scrollTop / 150);
            localStorage.setItem('thd_ects_scroll_index', index);
          }
        }, 150);
      });
    }

      loadAllData();
      ensureMailIds();
      initMailTimestamps();
      updateRelativeTimes();
      setInterval(updateRelativeTimes, 60000); // Aktualisiert die E-Mail-Zeiten jede Minute
      initWidgetDragAndDrop();
      initParkingChartInteraction();
      initGradeChartInteraction();
      setupTabletLayout();
      checkEmptyMailLists();
      updateParkingDisplay();
      initHeaderEasterEgg();
      // updateScheduleProgress(true, true); // Wird jetzt von loadSchedule -> updateScheduleWidget übernommen
      setInterval(() => updateScheduleProgress(false, false), 60000); // Aktualisiert den Zeitindikator jede Minute ohne Neu-Animation
      setInterval(refreshWebcam, 5000); // Aktualisiert das Webcam-Bild alle 5 Sekunden

      // Aktualisiert die Webcam sofort, wenn die App aus dem Hintergrund zurückgeholt wird
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          refreshWebcam();
          if (isRealModeEnabled) {
            loadRealMensaData();
            updateScheduleWidget(false);
          }
        }
      });

      if (localStorage.getItem('thd_setup_completed') !== 'true') {
        checkInitialSetup();
      } else {
        if (isRealModeEnabled) {
          loadRealMensaData(); // Lädt den Live-Speiseplan über OpenMensa beim App-Start
          loadSchedule(); // Lädt den iCal Stundenplan beim App-Start
        } else {
          updateScheduleProgress(true, true); // Synchronisiert Dummy-Daten mit der aktuellen echten Zeit beim Start
        }

        if (isStorageEnabled()) saveAllData();
      }
    });

    window.addEventListener('resize', () => {
      const activeRental = document.querySelector('#rental-views-container .rental-view.active');
      const viewport = document.getElementById('rental-views-viewport');
      if (activeRental && viewport && activeRental.offsetHeight > 0) {
        viewport.style.height = activeRental.offsetHeight + 'px';
      }
      setupTabletLayout();
    });

    // --- Studienzeit Logik ---
    let studyCurrent = 4;
    let studyTotal = 7;
    let studyExtra = 1;

    let pickerScrollTimeout;
    function initNumberPicker(containerId, min, max, initialValue) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const list = document.createElement('div');
        list.className = 'number-picker-list';
        container.innerHTML = ''; // Clear previous content
        container.appendChild(list);

        // Add padding items for start and end
        const paddingItem = document.createElement('div');
        paddingItem.className = 'number-picker-item';
        paddingItem.style.height = '40px'; // one item height
        list.appendChild(paddingItem.cloneNode());

        for (let i = min; i <= max; i++) {
            const item = document.createElement('div');
            item.className = 'number-picker-item';
            item.textContent = i;
            item.dataset.value = i;
            list.appendChild(item);
        }
        list.appendChild(paddingItem.cloneNode());

        const itemHeight = 40;
        const initialIndex = Math.max(0, initialValue - min);
        list.scrollTop = initialIndex * itemHeight;
        container.dataset.value = initialValue;

        const updateActiveItem = () => {
            const scrolledIndex = Math.round(list.scrollTop / itemHeight);
            Array.from(list.children).forEach((item, idx) => {
                if (idx === scrolledIndex + 1) { // +1 wegen des Platzhalters oben
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        };
        updateActiveItem();

        list.addEventListener('scroll', () => {
            updateActiveItem();
            clearTimeout(pickerScrollTimeout);
            pickerScrollTimeout = setTimeout(() => {
                const scrolledIndex = Math.round(list.scrollTop / itemHeight);
                const finalValue = min + scrolledIndex;

                list.scrollTo({ top: scrolledIndex * itemHeight, behavior: 'smooth' });
                container.dataset.value = finalValue;
            }, 150);
        });
    }

    function openStudyTimeModal() {
      initNumberPicker('picker-study-current', 1, 20, studyCurrent);
      initNumberPicker('picker-study-total', 1, 15, studyTotal);
      initNumberPicker('picker-study-extra', 0, 10, studyExtra);

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('study-time-modal').classList.add('show');
      }, 10);
    }

    function saveStudyTime() {
      studyCurrent = parseInt(document.getElementById('picker-study-current').dataset.value, 10) || 1;
      studyTotal = parseInt(document.getElementById('picker-study-total').dataset.value, 10) || 1;
      studyExtra = parseInt(document.getElementById('picker-study-extra').dataset.value, 10) || 0;

      updateStudyTimeDisplay(true);
      closeModal();
      if (isStorageEnabled()) saveAllData();
    }

    function updateStudyTimeDisplay(animate = true) {
      let studiedDays = studyCurrent <= 0 ? 0 : (studyCurrent - 1) * 180 + 100;
      let totalDays = (studyTotal + studyExtra) * 180;
      let remainingDays = Math.max(0, totalDays - studiedDays);
      let extraDays = studyExtra * 180;

      let fillPercent = totalDays > 0 ? (studiedDays / totalDays) * 100 : 0;
      let extraPercent = totalDays > 0 ? (extraDays / totalDays) * 100 : 0;
      if (fillPercent > 100) fillPercent = 100;

      const fillBar = document.querySelector('.progress-bar-fill');
      const extraBar = document.querySelector('.progress-bar-extra');

      if (fillBar) {
        fillBar.style.animation = 'none';
        if (animate) {
          fillBar.style.transition = 'none';
          fillBar.style.width = '0%';
          void fillBar.offsetWidth; // Reflow erzwingen
          setTimeout(() => {
            fillBar.style.transition = 'width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
            fillBar.style.width = fillPercent + '%';
        }, 50); // Startet die Animation schon, während die Seite noch hereinrutscht
        } else {
          fillBar.style.transition = 'none';
          fillBar.style.width = fillPercent + '%';
        }
      }
      if (extraBar) {
        extraBar.style.animation = 'none';
        if (animate) {
          extraBar.style.transition = 'none';
          extraBar.style.width = '0%';
          void extraBar.offsetWidth;
          setTimeout(() => {
            extraBar.style.transition = 'width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease';
            extraBar.style.width = extraPercent + '%';
            extraBar.style.opacity = extraPercent > 0 ? '1' : '0';
        }, 100); // Startet die Animation schon, während die Seite noch hereinrutscht
        } else {
          extraBar.style.transition = 'none';
          extraBar.style.width = extraPercent + '%';
          extraBar.style.opacity = extraPercent > 0 ? '1' : '0';
        }
      }

      const txtStudied = translations[currentLanguage].study_time_studied_dyn.replace('{days}', studiedDays);
      const txtRemaining = translations[currentLanguage].study_time_remaining_dyn.replace('{days}', remainingDays);
      const txtExtra = translations[currentLanguage].study_time_extra_dyn.replace('{days}', extraDays).replace('{n}', studyExtra);

      const homeStudiedEl = document.getElementById('home-studied-number');
      const homeRemainingEl = document.getElementById('home-remaining-number');
      if (homeStudiedEl) homeStudiedEl.innerText = studiedDays;
      if (homeRemainingEl) homeRemainingEl.innerText = remainingDays;

      const studiedEl = document.querySelector('[data-translate="study_time_studied"]');
      const remainingEl = document.querySelector('[data-translate="study_time_remaining"]');
      const extraEl = document.querySelector('[data-translate="study_time_extra"]');

      if (studiedEl) studiedEl.innerText = txtStudied;
      if (remainingEl) remainingEl.innerText = txtRemaining;
      if (extraEl) {
        if (studyExtra > 0) {
          extraEl.innerText = txtExtra;
          extraEl.style.display = 'block';
        } else {
          extraEl.style.display = 'none';
        }
      }

      // Original-Texte dynamisch überschreiben, damit setLanguage(lang) auch nach Sprachwechsel die Werte weiß
      ['de', 'en', 'fi'].forEach(lang => {
        translations[lang].study_time_studied = translations[lang].study_time_studied_dyn.replace('{days}', studiedDays);
        translations[lang].study_time_remaining = translations[lang].study_time_remaining_dyn.replace('{days}', remainingDays);
        translations[lang].study_time_extra = translations[lang].study_time_extra_dyn.replace('{days}', extraDays).replace('{n}', studyExtra);
      });
    }

    // Umschalter für Mail / iLearn
    function switchNotificationView(viewId, buttonElement) {
      const buttons = document.querySelectorAll('#page-mails .segment-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      buttonElement.classList.add('active');

      const segmentedControl = document.getElementById('mail-segments');
      if (viewId === 'ilearn') segmentedControl.classList.add('index-1');
      else segmentedControl.classList.remove('index-1');

      const views = document.querySelectorAll('#page-mails .notification-view');
      views.forEach(view => view.classList.remove('active'));

      const targetView = document.getElementById(viewId + '-view');
      if (targetView) targetView.classList.add('active');

      const container = document.getElementById('notification-container');
      if (viewId === 'mails') container.style.transform = 'translateX(0)';
      else container.style.transform = 'translateX(-50%)';

      const mailPage = document.getElementById('page-mails');
      if (viewId === 'ilearn') {
        mailPage.classList.add('ilearn-active');
      } else {
        mailPage.classList.remove('ilearn-active');
      }
    }

    // Umschalter für Verleih
    function switchRentalView(viewId, buttonElement) {
      const card = buttonElement.closest('.rental-card');
      const buttons = card.querySelectorAll('.segment-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      buttonElement.classList.add('active');

      const segmentedControl = document.getElementById('rental-segments');
      if (viewId === 'tech') segmentedControl.classList.add('index-1');
      else segmentedControl.classList.remove('index-1');

      const views = card.querySelectorAll('.rental-view');
      views.forEach(view => {
        view.classList.remove('active');
        view.style.opacity = '0';
        view.style.pointerEvents = 'none';
      });

      const targetView = card.querySelector('#rental-' + viewId + '-view');
      if (targetView) {
        targetView.classList.add('active');
        targetView.style.opacity = '1';
        targetView.style.pointerEvents = 'auto';
      }

      const container = document.getElementById('rental-views-container');
      if (viewId === 'books') container.style.transform = 'translateX(0)';
      else container.style.transform = 'translateX(-50%)';

      // Passe Wrapper-Höhe an Inhalt an
      const viewport = document.getElementById('rental-views-viewport');
      if (viewport && targetView) viewport.style.height = targetView.offsetHeight + 'px';
      if (isStorageEnabled()) {
          localStorage.setItem('thd_rental_view', viewId);
      }
    }

    // Modal (Popup) Logik
    function openModal(title, time, room, tasks, searchKeyword) {
      document.getElementById('popup-title').innerText = title;
      document.getElementById('popup-time').innerText = time;
      document.getElementById('popup-room').innerText = room;
      document.getElementById('popup-tasks').innerText = tasks;

      const buildings = document.querySelectorAll('.building');
      buildings.forEach(b => b.classList.remove('active'));

      const buildingLetter = room.charAt(0).toUpperCase();
      const targetBuilding = document.getElementById('bldg-' + buildingLetter);

      if (room.toLowerCase().includes('bibliothek') || room.toLowerCase().includes('library')) {
        const bldgG = document.getElementById('bldg-G');
        if(bldgG) bldgG.classList.add('active');
      } else if (buildingLetter === 'I' || title.includes("ITC")) {
        const itc = document.getElementById('bldg-ITC');
        if(itc) itc.classList.add('active');
      }
      else if (targetBuilding) {
        targetBuilding.classList.add('active');
      }

      document.getElementById('modal-overlay').classList.add('show');

      const closeBtn = document.getElementById('course-modal-close-btn');
      if (closeBtn) {
        closeBtn.classList.remove('btn-primary');
        closeBtn.classList.add('btn-secondary');
      }

      const iLearnBtn = document.getElementById('course-modal-ilearn-btn');
      if (iLearnBtn) {
        iLearnBtn.style.display = 'block';
        if (searchKeyword) {
            iLearnBtn.onclick = () => goToILearnNotification(searchKeyword);
        } else {
            iLearnBtn.onclick = () => window.location.href='https://elearning.th-deg.de';
        }
      }

      setTimeout(() => {
        document.getElementById('course-modal').classList.add('show');
      }, 10);
    }

    function goToILearnNotification(keyword) {
      closeModal();
      setTimeout(() => {
        // Zum Mails Tab wechseln per Klick
        const mailsNavBtn = document.querySelectorAll('.nav-item')[2];
        if (mailsNavBtn) mailsNavBtn.click();

        // Zum iLearn Segment wechseln per Klick
        const ilearnSegmentBtn = document.querySelectorAll('#mail-segments .segment-btn')[1];
        if (ilearnSegmentBtn && !ilearnSegmentBtn.classList.contains('active')) {
            ilearnSegmentBtn.click();
        }

        // iLearn E-Mail finden und öffnen
        const ilearnMails = document.querySelectorAll('#ilearn-view .mail-item');
        for (let mail of ilearnMails) {
            if (mail.innerText.toLowerCase().includes(keyword.toLowerCase())) {
                setTimeout(() => {
                    mail.click();
                    mail.classList.add('highlight-anim');
                            setTimeout(() => mail.classList.remove('highlight-anim'), 1400);
                }, 400); // Kurz warten, bis die Ansicht und Animationen fertig sind
                break;
            }
        }
      }, 300); // Warten bis das alte Modal zu ist
    }

    function openFoodModal(name, price, desc, allergens, allPrices = '') {
      document.getElementById('food-popup-title').innerText = name;
      document.getElementById('food-popup-price').innerText = price;
      document.getElementById('food-popup-desc').innerText = desc;
      document.getElementById('food-popup-allergens').innerText = allergens;

      const pricesEl = document.getElementById('food-popup-all-prices');
      if (pricesEl) {
          pricesEl.innerHTML = allPrices;
      }

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('food-modal').classList.add('show');
      }, 10);
    }

    function openMensaMenuModal(jumpToNext = false) {
      mensaWeekOffset = 0;
      let day = new Date().getDay() - 1;

      if (jumpToNext === true) {
          if (day >= 0 && day < 4) {
              currentMensaDay = day + 1;
          } else {
              currentMensaDay = 0;
              mensaWeekOffset = 1;
          }
      } else {
          if (day < 0 || day > 4) {
              currentMensaDay = 0;
              mensaWeekOffset = 1;
          } else {
              currentMensaDay = day;
          }
      }

      updateMensaWeekLabel();

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('mensa-menu-modal').classList.add('show');

        const dayBtns = document.querySelectorAll('#mensa-day-segments .segment-btn');
        if (dayBtns[currentMensaDay]) {
            switchMensaDay(currentMensaDay, dayBtns[currentMensaDay]);
        } else {
            updateMensaModalView();
        }
      }, 10);
    }

    function changeMensaWeek(dir) {
        mensaWeekOffset += dir;
        updateMensaWeekLabel();

        let newDay = dir > 0 ? 0 : 4; // 0 = Montag, 4 = Freitag
        const dayBtns = document.querySelectorAll('#mensa-day-segments .segment-btn');
        if (dayBtns[newDay]) {
            switchMensaDay(newDay, dayBtns[newDay]);
        } else {
            currentMensaDay = newDay;
            updateMensaModalView();
        }
    }

    function updateMensaWeekLabel() {
        const label = document.getElementById('mensa-week-label');
        if (!label) return;
        if (mensaWeekOffset === 0) {
            label.innerText = translations[currentLanguage].schedule_week_this;
        } else if (mensaWeekOffset === 1) {
            label.innerText = translations[currentLanguage].schedule_week_next;
        } else if (mensaWeekOffset === -1) {
            label.innerText = translations[currentLanguage].schedule_week_last;
        } else if (mensaWeekOffset > 1) {
            label.innerText = translations[currentLanguage].schedule_week_in.replace('{n}', mensaWeekOffset);
        } else {
            label.innerText = translations[currentLanguage].schedule_week_ago.replace('{n}', Math.abs(mensaWeekOffset));
        }
    }

    function switchMensaDay(dayIndex, btn) {
        const control = document.getElementById('mensa-day-segments');
        const buttons = control.querySelectorAll('.segment-btn');
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const highlight = document.getElementById('mensa-day-highlight');
        highlight.style.transform = `translateX(${dayIndex * 100}%)`;

        currentMensaDay = dayIndex;
        updateMensaModalView();
    }

    async function updateMensaModalView() {
        const list = document.getElementById('mensa-modal-list');
        const viewport = document.getElementById('mensa-viewport');

        if (!isRealModeEnabled) {
            const demoMenus = [
                [ // Montag
                    { category: 'Tagesgericht', name: 'Currywurst mit Pommes', price: '4,20€', desc: 'Der Klassiker der Mensa.', allergens: 'Senf, Sellerie', pricesAll: 'Studierende: 4,20€<br>Mitarbeiter: 5,50€' },
                    { category: 'Tagesgericht', name: 'Spaghetti Bolognese', price: '3,90€', desc: 'Mit Rinderhackfleisch und Parmesan.', allergens: 'Gluten, Milch', pricesAll: 'Studierende: 3,90€<br>Mitarbeiter: 5,20€' },
                    { category: 'Vegetarisch', name: 'Gemüse-Lasagne', price: '3,80€', desc: 'Hausgemachte Lasagne mit frischem Saisongemüse.', allergens: 'Gluten, Milch', pricesAll: 'Studierende: 3,80€<br>Mitarbeiter: 4,90€' }
                ],
                [ // Dienstag
                    { category: 'Tagesgericht', name: 'Schweinebraten mit Kartoffelsalat', price: '5,50€', desc: 'Bayerischer Schweinebraten mit Dunkelbiersoße.', allergens: 'Gluten, Sellerie', pricesAll: 'Studierende: 5,50€<br>Mitarbeiter: 6,80€' },
                    { category: 'Vegetarisch', name: 'Käsespätzle mit Röstzwiebeln', price: '3,50€', desc: 'Allgäuer Käsespätzle frisch zubereitet.', allergens: 'Gluten, Milch, Ei', pricesAll: 'Studierende: 3,50€<br>Mitarbeiter: 4,80€' },
                    { category: 'Dessert', name: 'Milchreis mit Zimt und Zucker', price: '1,50€', desc: 'Süßer Abschluss.', allergens: 'Milch', pricesAll: 'Studierende: 1,50€<br>Mitarbeiter: 2,00€' }
                ],
                [ // Mittwoch
                    { category: 'Tagesgericht', name: 'Rindergulasch mit Nudeln', price: '5,20€', desc: 'Deftiges Gulasch vom Rind.', allergens: 'Gluten', pricesAll: 'Studierende: 5,20€<br>Mitarbeiter: 6,50€' },
                    { category: 'Vegetarisch', name: 'Falafel-Burger', price: '4,90€', desc: 'Mit Süßkartoffelpommes und Dip.', allergens: 'Gluten, Sesam', pricesAll: 'Studierende: 4,90€<br>Mitarbeiter: 6,00€' },
                    { category: 'Suppe', name: 'Tomatensuppe', price: '2,50€', desc: 'Fruchtige Tomatensuppe mit Basilikum.', allergens: '-', pricesAll: 'Studierende: 2,50€<br>Mitarbeiter: 3,50€' }
                ],
                [ // Donnerstag
                    { category: 'Tagesgericht', name: 'Cordon Bleu mit Pommes', price: '5,60€', desc: 'Vom Schwein, gefüllt mit Schinken und Käse.', allergens: 'Gluten, Milch, Ei', pricesAll: 'Studierende: 5,60€<br>Mitarbeiter: 6,90€' },
                    { category: 'Tagesgericht', name: 'Chili con Carne', price: '4,20€', desc: 'Mit Reis und Nachos.', allergens: '-', pricesAll: 'Studierende: 4,20€<br>Mitarbeiter: 5,50€' },
                    { category: 'Vegetarisch', name: 'Kaiserschmarrn', price: '3,20€', desc: 'Mit Apfelmus oder Zwetschgenröster.', allergens: 'Gluten, Milch, Ei', pricesAll: 'Studierende: 3,20€<br>Mitarbeiter: 4,50€' }
                ],
                [ // Freitag
                    { category: 'Tagesgericht', name: 'Backfisch mit Kartoffelsalat', price: '4,90€', desc: 'Seelachsfilet in knuspriger Panade.', allergens: 'Gluten, Fisch, Ei', pricesAll: 'Studierende: 4,90€<br>Mitarbeiter: 6,20€' },
                    { category: 'Vegetarisch', name: 'Veganes Schnitzel', price: '4,50€', desc: 'Auf Sojabasis mit Pommes.', allergens: 'Gluten, Soja', pricesAll: 'Studierende: 4,50€<br>Mitarbeiter: 5,80€' }
                ]
            ];

            const currentDemoMeals = demoMenus[currentMensaDay] || demoMenus[0];
            const categories = {};
            currentDemoMeals.forEach(meal => {
                if (!categories[meal.category]) categories[meal.category] = [];
                categories[meal.category].push(meal);
            });

            let html = '';
            for (const [catName, catMeals] of Object.entries(categories)) {
                html += `<div style="margin-bottom: 20px;">
                    <div class="section-title" style="margin-bottom: 10px; color: var(--text-sub); font-weight: 500; font-size: 15px; padding-left: 4px;">${catName}</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">`;
                catMeals.forEach(meal => {
                    html += `<div class="list-item" style="cursor: pointer; background-color: var(--item-bg); display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 12px; position: relative; isolation: isolate; width: 100%; box-sizing: border-box;" onclick="openFoodModalFromMenu('${meal.name}', '${meal.price}', '${meal.desc}', '${meal.allergens}', '${meal.pricesAll}')">
                        <span style="font-weight: 600; color: var(--text-main); font-size: 14px; flex: 1; min-width: 0; padding-right: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meal.name}</span>
                            <span class="item-value" style="color: var(--accent-blue); font-size: 14px; font-weight: 600; white-space: nowrap;">${meal.price}</span>
                        </div>`;
                });
                html += `</div></div>`;
            }
            list.innerHTML = html;
            list.style.height = 'auto';
            const newHeight = list.scrollHeight;
            list.style.height = '100%';
            const maxHeight = window.innerHeight * 0.45;
            viewport.style.height = (newHeight > maxHeight ? maxHeight : newHeight) + 'px';
            list.style.overflowY = newHeight > maxHeight ? 'auto' : 'hidden';
            return;
        }

        const now = new Date();
        const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfCurrentWeek = new Date(now);
        startOfCurrentWeek.setDate(now.getDate() - currentDayOfWeek);
        startOfCurrentWeek.setHours(0,0,0,0);

        const targetDate = new Date(startOfCurrentWeek);
        targetDate.setDate(startOfCurrentWeek.getDate() + (mensaWeekOffset * 7) + currentMensaDay);

        const localTarget = new Date(targetDate);
        localTarget.setMinutes(localTarget.getMinutes() - localTarget.getTimezoneOffset());
        const dateStr = localTarget.toISOString().split('T')[0];

        let meals = [];
        try {
            if (mensaDataCache[dateStr]) {
                meals = mensaDataCache[dateStr];
            } else {
                list.innerHTML = '<div style="text-align: center; color: var(--text-sub); padding: 30px 10px;">Lade Speiseplan...</div>';
                const mensaId = 198;
                const res = await fetch(`https://openmensa.org/api/v2/canteens/${mensaId}/days/${dateStr}/meals`);
                if (res.ok) {
                    meals = await res.json();
                    mensaDataCache[dateStr] = meals;
                    saveMensaCache();
                } else {
                    meals = null;
                }
            }
        } catch (e) {
            meals = null;
        }

        list.innerHTML = '';

        if (!meals || meals.length === 0) {
            list.innerHTML = `<div data-translate="mensa_no_meals" style="text-align: center; color: var(--text-sub); padding: 30px 10px;">${translations[currentLanguage].mensa_no_meals}</div>`;
            list.innerHTML = `<div data-translate="mensa_no_meals" style="text-align: center; color: var(--text-sub); padding: 30px 10px;">${translations[currentLanguage].mensa_no_meals}</div>`;
        } else {
            const categories = {};
            meals.forEach(meal => {
                if (!categories[meal.category]) categories[meal.category] = [];
                categories[meal.category].push(meal);
            });

            for (const [categoryName, categoryMeals] of Object.entries(categories)) {
                const section = document.createElement('div');
                section.style.marginBottom = '20px';

                const title = document.createElement('div');
                title.className = 'section-title';
                title.style.cssText = 'margin-bottom: 10px; color: var(--text-sub); font-weight: 500; font-size: 15px; padding-left: 4px;';
                title.innerText = categoryName;
                section.appendChild(title);

                const itemsContainer = document.createElement('div');
                itemsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

                categoryMeals.forEach(meal => {
                    let priceStud = meal.prices && meal.prices.students !== null ? meal.prices.students.toFixed(2).replace('.', ',') + '€' : '-';
                    let priceEmp = meal.prices && meal.prices.employees !== null ? meal.prices.employees.toFixed(2).replace('.', ',') + '€' : '-';
                    let priceGuest = meal.prices && meal.prices.others !== null ? meal.prices.others.toFixed(2).replace('.', ',') + '€' : '-';

                    let allPricesHTML = `Studierende: ${priceStud}<br>Mitarbeiter: ${priceEmp}<br>Gäste: ${priceGuest}`;
                    const notes = meal.notes && meal.notes.length > 0 ? meal.notes.join(', ') : 'Keine Angaben';

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'list-item';
                    itemDiv.style.cssText = 'cursor: pointer; background-color: var(--item-bg); margin: 0; position: relative; isolation: isolate; display: flex; justify-content: space-between; align-items: center; width: 100%; box-sizing: border-box;';

                    itemDiv.onclick = () => openFoodModalFromMenu(meal.name, priceStud, categoryName, notes, allPricesHTML);
                itemDiv.innerHTML = `<span style="font-weight: 600; color: var(--text-main); font-size: 14px; flex: 1; min-width: 0; padding-right: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meal.name}</span><span class="item-value" style="color: var(--accent-blue); font-size: 14px; font-weight: 600; white-space: nowrap;">${priceStud}</span>`;

                    itemsContainer.appendChild(itemDiv);
                });

                section.appendChild(itemsContainer);
                list.appendChild(section);
            }
        }

        list.style.height = 'auto';
        const newHeight = list.scrollHeight;
        list.style.height = '100%';
        const maxHeight = window.innerHeight * 0.45;

        if (newHeight > maxHeight) {
            viewport.style.height = maxHeight + 'px';
            list.style.overflowY = 'auto';
        } else {
            viewport.style.height = newHeight + 'px';
            list.style.overflowY = 'hidden';
        }
    }

    function openFoodModalFromMenu(name, price, desc, allergens, allPrices = '') {
      closeModal();
      setTimeout(() => {
        openFoodModal(name, price, desc, allergens, allPrices);
      }, 300);
    }

    function goBackToMenu() {
      closeModal();
      setTimeout(() => {
        openMensaMenuModal();
      }, 300);
    }

    function openMapForBuilding(letter, title) {
  // Wenn es Gebäude F ist, zeige "1. Stock" statt Erdgeschoss
  let floor = "Erdgeschoss";
  if (letter === 'F') {
    floor = "1. Stock (Lernplätze)";
  }

  // Nutzt das bestehende Kurs-Modal für die Karte
  openModal(title, 'Gebäude ' + letter, letter + ' Gebäude', floor);

  const closeBtn = document.getElementById('course-modal-close-btn');
  if (closeBtn) {
    closeBtn.classList.remove('btn-secondary');
    closeBtn.classList.add('btn-primary');
  }

  const iLearnBtn = document.getElementById('course-modal-ilearn-btn');
  if (iLearnBtn) {
    iLearnBtn.style.display = 'none';
  }
}

   function openEventModal(title, time, location, description, id) {
        document.getElementById('event-popup-title').innerText = title;
        document.getElementById('event-popup-time').innerText = time;
        document.getElementById('event-popup-location').innerText = location || (currentLanguage === 'de' ? 'Keine Angabe' : (currentLanguage === 'fi' ? 'Ei ilmoitettu' : 'Not specified'));
        document.getElementById('event-popup-desc').innerHTML = description || (currentLanguage === 'de' ? 'Keine Beschreibung verfügbar.' : (currentLanguage === 'fi' ? 'Ei kuvausta saatavilla.' : 'No description available.'));

        const icalBtn = document.getElementById('event-popup-ical-btn');
        if (icalBtn) {
            icalBtn.onclick = () => {
                window.location.href = `https://th-deg.de/de/ical-export?eventid=${id}`;
            };
        }

        document.getElementById('modal-overlay').classList.add('show');
        setTimeout(() => {
            document.getElementById('event-modal').classList.add('show');
        }, 10);
    }


    let previousModal = null;

    let setupCountdownInterval;
    function startSetupCountdown() {
      const btn = document.getElementById('setup-continue-btn');
      if (!btn) return;

      clearInterval(setupCountdownInterval);
      let counter = 5;

      // Button initial sperren und grauer machen
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.removeAttribute('data-translate');
      btn.innerText = `${translations[currentLanguage].continue_button} (${counter})`;

      setupCountdownInterval = setInterval(() => {
          counter--;
          if (counter > 0) {
              btn.innerText = `${translations[currentLanguage].continue_button} (${counter})`;
          } else {
              clearInterval(setupCountdownInterval);
              btn.disabled = false;
              btn.style.opacity = '1';
              btn.style.cursor = 'pointer';
              btn.setAttribute('data-translate', 'continue_button');
              btn.innerText = translations[currentLanguage].continue_button;
          }
      }, 1000);
    }

    function checkInitialSetup() {
      const storageToggle = document.getElementById('setup-storage-toggle');
      const realModeToggle = document.getElementById('setup-real-mode-toggle');
      const showAgainToggle = document.getElementById('setup-show-again-toggle');

      if (localStorage.getItem('thd_storage_enabled') !== null && storageToggle) {
          storageToggle.checked = isStorageEnabled();
      }
      if (localStorage.getItem('thd_real_mode') !== null && realModeToggle) {
          realModeToggle.checked = isRealModeEnabled;
      }
      if (localStorage.getItem('thd_setup_completed') !== null && showAgainToggle) {
          showAgainToggle.checked = localStorage.getItem('thd_setup_completed') === 'false';
      }

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('initial-setup-modal').classList.add('show');
        startSetupCountdown();
      }, 10);
    }

    function completeSetup() {
      const storageEnabled = document.getElementById('setup-storage-toggle').checked;
      const realModeEnabled = document.getElementById('setup-real-mode-toggle').checked;
      const showAgain = document.getElementById('setup-show-again-toggle').checked;

      if (storageEnabled) {
          localStorage.setItem('thd_storage_enabled', 'true');
          localStorage.setItem('thd_real_mode', realModeEnabled ? 'true' : 'false');

          if (showAgain) {
              localStorage.setItem('thd_setup_completed', 'false');
          } else {
              localStorage.setItem('thd_setup_completed', 'true');
          }
      } else {
          localStorage.setItem('thd_storage_enabled', 'false');
          localStorage.removeItem('thd_setup_completed');
      }

      isRealModeEnabled = realModeEnabled;

      const storageToggle = document.getElementById('storage-toggle');
      if (storageToggle) storageToggle.checked = storageEnabled;

      const realToggle = document.getElementById('real-mode-toggle');
      if (realToggle) realToggle.checked = realModeEnabled;

      closeModal(true);

      if (realModeEnabled) {
          loadRealMensaData();
          loadSchedule();
      } else {
          updateScheduleProgress(true, true); // Fortschrittsbalken und Scrollen im Demo-Modus anwenden
      }
      saveAllData();
    }

    function showInfoModal(type) {
      const allModals = document.querySelectorAll('.modal.show');
      allModals.forEach(m => {
        if (m.id !== 'info-modal') {
          previousModal = m.id;
          m.classList.remove('show');
        }
      });

      const titleEl = document.getElementById('info-modal-title');
      const descEl = document.getElementById('info-modal-desc');
      descEl.style.wordBreak = '';

      if (type === 'storage') {
        titleEl.innerText = translations[currentLanguage].info_storage_title;
        descEl.innerText = translations[currentLanguage].info_storage_desc;
        titleEl.setAttribute('data-translate', 'info_storage_title');
        descEl.setAttribute('data-translate', 'info_storage_desc');
      } else if (type === 'real_mode') {
        titleEl.innerText = translations[currentLanguage].info_real_mode_title;
        descEl.innerText = translations[currentLanguage].info_real_mode_desc;
        titleEl.setAttribute('data-translate', 'info_real_mode_title');
        descEl.setAttribute('data-translate', 'info_real_mode_desc');
      } else if (type === 'privacy') {
        titleEl.innerText = translations[currentLanguage].info_privacy_title;
        descEl.innerText = translations[currentLanguage].info_privacy_desc;
        titleEl.setAttribute('data-translate', 'info_privacy_title');
        descEl.setAttribute('data-translate', 'info_privacy_desc');
      } else if (type === 'show_again') {
        titleEl.innerText = translations[currentLanguage].info_show_again_title;
        descEl.innerText = translations[currentLanguage].info_show_again_desc;
        titleEl.setAttribute('data-translate', 'info_show_again_title');
        descEl.setAttribute('data-translate', 'info_show_again_desc');
      } else if (type === 'ai_generate') {
        titleEl.innerText = translations[currentLanguage].info_ai_generate_title;
        descEl.innerText = translations[currentLanguage].info_ai_generate_desc;
        titleEl.setAttribute('data-translate', 'info_ai_generate_title');
        descEl.setAttribute('data-translate', 'info_ai_generate_desc');
      }

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('info-modal').classList.add('show');
      }, 10);
    }

    function showErrorDetailsModal(errorText) {
      const allModals = document.querySelectorAll('.modal.show');
      allModals.forEach(m => {
        if (m.id !== 'info-modal') {
          previousModal = m.id;
          m.classList.remove('show');
        }
      });

      const titleEl = document.getElementById('info-modal-title');
      const descEl = document.getElementById('info-modal-desc');

      titleEl.innerText = currentLanguage === 'de' ? 'Fehler-Details' : 'Error Details';
      titleEl.removeAttribute('data-translate');

      descEl.innerText = errorText;
      descEl.removeAttribute('data-translate');
      descEl.style.wordBreak = 'break-word'; // Verhindert, dass lange Fehler-Strings das Layout sprengen

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('info-modal').classList.add('show');
      }, 10);
    }

    function closeInfoModal() {
      document.getElementById('info-modal').classList.remove('show');
      if (previousModal) {
        setTimeout(() => {
          document.getElementById(previousModal).classList.add('show');
          previousModal = null;
        }, 300);
      } else {
        closeModal();
      }
    }

    function closeModal(force = false) {
      if (!force && localStorage.getItem('thd_setup_completed') !== 'true') {
         const infoModal = document.getElementById('info-modal');
         if (infoModal && infoModal.classList.contains('show') && previousModal === 'initial-setup-modal') {
             closeInfoModal();
             return;
         }

         const setupModal = document.getElementById('initial-setup-modal');
         if (setupModal && setupModal.classList.contains('show')) {
             return;
         }
      }

      const allModals = document.querySelectorAll('.modal');
      const deleteModal = document.getElementById('delete-modal');
      const mailPage = document.getElementById('page-mails');

      // Wenn das Löschen-Fenster durch Gedrückthalten geöffnet und dann abgebrochen wird, Auswahl aufheben
      if (deleteModal.classList.contains('show') && !mailPage.classList.contains('selection-mode')) {
          document.querySelectorAll('.mail-item.selected').forEach(item => item.classList.remove('selected'));
      }

      allModals.forEach(m => {
        m.classList.remove('show');
        m.classList.remove('keyboard-up');
      });
      document.getElementById('modal-overlay').classList.remove('show');
      isLongPress = false; // Sicherheitsnetz: Setzt den Status global zurück

      // Schließt den Deckel des Such-Mülleimers, falls er offen ist
      document.getElementById('search-trash-icon')?.classList.remove('lid-stay-open');

      const iframeContent = document.getElementById('iframe-modal-content');
      if (iframeContent) iframeContent.src = '';
    }

    function updateCharCount() {
      const body = document.getElementById('comp-body');
      const counter = document.getElementById('char-count');

      if (body && counter) {
        const len = body.value.length;
        counter.innerText = len + ' / 500';

        if (len >= 500) {
          counter.style.color = '#FF3B30'; // Rot bei Limit
        } else if (len >= 450) {
          counter.style.color = 'var(--accent-orange)'; // Orange als Warnung
        } else {
          counter.style.color = 'var(--text-sub)'; // Normalgrau
        }
      }
    }

    function openComposeModal(isReply = false) {
      if (isReply !== true) {
        const bodyEl = document.getElementById('comp-body');
        if (bodyEl) bodyEl.dataset.context = '';
      }
      updateCharCount(); // Zähler beim Öffnen aktualisieren/zurücksetzen
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('compose-modal').classList.add('show');
      }, 10);
    }

    function replyToMail(sender, subject, originalMessage = "") {
      closeModal(); // Erstes Fenster schließen
      setTimeout(() => {
        // Felder automatisch ausfüllen
        document.getElementById('comp-to').value = sender;
        document.getElementById('comp-subject').value = "Re: " + subject.replace(/^Re:\s*/i, '');
        document.getElementById('comp-body').value = "";
        const bodyEl = document.getElementById('comp-body');
        if (bodyEl) bodyEl.dataset.context = originalMessage;
        openComposeModal(true); // Neues Fenster öffnen
      }, 300); // Kurz warten, bis das erste Fenster zu ist
    }

    function openWidgetSettingsModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('widget-settings-modal').classList.add('show');
      }, 10);
    }

    function openInsufficientFundsModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('insufficient-funds-modal').classList.add('show');
      }, 10);
    }

    function openTopupModalFromInsufficient() {
      closeModal();
      setTimeout(openTopupModal, 300);
    }

    function openGpaModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('gpa-modal').classList.add('show');
      }, 10);
    }

    let selectedTopupAmount = 50;

    function updateTopupDisplay() {
        const slider = document.getElementById('topup-slider');
        selectedTopupAmount = parseInt(slider.value, 10);
        document.getElementById('topup-amount-display').innerText = selectedTopupAmount.toFixed(2).replace('.', ',') + '€';

        const percentage = ((selectedTopupAmount - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.setProperty('--slider-fill', percentage + '%');
    }

    function openTopupModal() {
      selectedTopupAmount = 50;
      const slider = document.getElementById('topup-slider');
      if(slider) {
          slider.value = 50;
          updateTopupDisplay();
      }
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('topup-modal').classList.add('show');
      }, 10);
    }

    function openTopupConfirmModal() {
      closeModal();

      const amountStr = selectedTopupAmount.toFixed(2).replace('.', ',') + '€';
      document.getElementById('confirm-amount').innerText = amountStr;
      document.getElementById('confirm-total').innerText = amountStr;

      setTimeout(() => {
        document.getElementById('modal-overlay').classList.add('show');
        document.getElementById('topup-confirm-modal').classList.add('show');
      }, 300); // Kurz warten bis das erste Fenster geschlossen ist
    }

    function openTowModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('tow-modal').classList.add('show');
      }, 10);
    }

    function openParkingModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('parking-modal').classList.add('show');
      }, 10);
    }

    function handleParkingClick(e) {
      openParkingModal();
    }

    // Alte Parkplatz-Klick-Logik entfernt

    function toggleWidget(widgetId, checkbox, save = true) {
      const widget = document.getElementById(widgetId);
      if (widget) {
        if (checkbox.checked) {
          widget.classList.remove('widget-hidden');
        } else {
          widget.classList.add('widget-hidden');
        }
      }

      // Special handling for the bottom row container
      if (widgetId === 'widget-vpn' || widgetId === 'widget-services') {
        const vpnInput = document.querySelector('input[onchange="toggleWidget(\'widget-vpn\', this)"]');
        const servicesInput = document.querySelector('input[onchange="toggleWidget(\'widget-services\', this)"]');
        const bottomRow = document.getElementById('widget-bottom-row');
        if (bottomRow && vpnInput && servicesInput) {
            if (!vpnInput.checked && !servicesInput.checked) {
                bottomRow.classList.add('widget-hidden');
            } else {
                bottomRow.classList.remove('widget-hidden');
            }
        }
      }

      // Special handling for the top row container
      if (widgetId === 'widget-ects' || widgetId === 'widget-schedule') {
        const ectsInput = document.querySelector('input[onchange="toggleWidget(\'widget-ects\', this)"]');
        const schedInput = document.querySelector('input[onchange="toggleWidget(\'widget-schedule\', this)"]');
        const topRow = document.getElementById('widget-top-row');
        if (topRow && ectsInput && schedInput) {
            if (!ectsInput.checked && !schedInput.checked) {
                topRow.classList.add('widget-hidden');
            } else {
                topRow.classList.remove('widget-hidden');
            }
        }
      }

      // Prüfen, ob alle Widgets ausgeblendet sind (Easter Egg)
      const allWidgets = ['widget-ects', 'widget-schedule', 'widget-mensa', 'widget-parking', 'widget-rental', 'widget-vpn', 'widget-services', 'widget-weather', 'widget-todo'];
      const isAnyVisible = allWidgets.some(id => {
        const w = document.getElementById(id);
        return w && !w.classList.contains('widget-hidden');
      });
      const emptyMsg = document.getElementById('empty-dashboard-msg');
      if (emptyMsg) {
        if (!isAnyVisible) {
          emptyMsg.style.display = 'flex';
          emptyMsg.style.animation = 'fadeIn 0.5s ease';
        } else {
          emptyMsg.style.display = 'none';
        }
      }

      if (save && isStorageEnabled()) {
        saveAllData();
      }
    }

    function updateUnreadBadge() {
      const unreadCount = document.querySelectorAll('.mail-item.unread').length;
      const badge = document.getElementById('unread-badge');
      if (badge) {
        if (unreadCount > 0) {
          badge.classList.add('show');
        } else {
          badge.classList.remove('show');
        }
      }
    }

    function checkEmptyMailLists() {
      document.querySelectorAll('.mail-list').forEach(list => {
        const hasMails = list.querySelector('.mail-item') !== null;
        let emptyMsg = list.querySelector('.empty-mail-msg');

        if (!hasMails) {
          if (!emptyMsg) {
            emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-mail-msg';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = 'var(--text-sub)';
            emptyMsg.style.padding = '30px 15px';
            emptyMsg.style.margin = 'auto';
            emptyMsg.style.fontSize = '14px';
            emptyMsg.setAttribute('data-translate', 'empty_mails');
            emptyMsg.innerText = translations[currentLanguage] ? translations[currentLanguage].empty_mails : "Keine Nachrichten vorhanden";
            list.appendChild(emptyMsg);
          }
          emptyMsg.style.display = 'block';
        } else if (emptyMsg) {
          emptyMsg.style.display = 'none';
        }
      });
    }

    function openDeleteModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('delete-modal').classList.add('show');
      }, 10);
    }

    function confirmDelete() {
      if (itemToDelete === 'ects') {
        // ECTS im Profil auf 0 setzen
        const profileEctsValue = document.querySelector('#profile-ects-card .stat-value');
        if (profileEctsValue) profileEctsValue.innerText = '0';

        // ECTS auf dem Home-Dashboard ebenfalls auf 0 setzen
        const homeEctsValue = document.querySelector('.ects-number');
        if (homeEctsValue) homeEctsValue.innerText = '0';

        studyCurrent = 0; // 0 Tage studiert
        studyTotal = 7;   // Standard
        studyExtra = 5;   // 5 Extra-Semester als "Strafe"
        updateStudyTimeDisplay(true);

        if (isStorageEnabled()) saveAllData();
      } else {
        const selectedItems = document.querySelectorAll('.mail-item.selected');
        if (selectedItems.length > 0) {
          selectedItems.forEach(item => {
            // Damit das Aufrücken weich animiert wird, fixieren wir erst die Höhe
            item.style.height = item.offsetHeight + 'px';
            item.style.overflow = 'hidden';
            item.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)';

            // Reflow erzwingen (damit der Browser die Starthöhe sicher registriert)
            void item.offsetHeight;

            // Nun die Werte auf 0 setzen für ein geschmeidiges Zusammenklappen
            item.style.opacity = '0';
            item.style.transform = 'translateX(-100%)';
            item.style.height = '0px';
            item.style.paddingTop = '0px';
            item.style.paddingBottom = '0px';
            item.style.marginTop = '0px';
            item.style.marginBottom = '-12px'; // Gleicht den 12px Flex-Gap der Liste aus

            setTimeout(() => {
              item.remove();
              updateUnreadBadge();
              checkEmptyMailLists();
                if (isStorageEnabled()) saveAllData();
            }, 300);
          });
          if (document.getElementById('page-mails').classList.contains('selection-mode')) {
              toggleSelectionMode();
          }
        }
      }
      closeModal();
      if (isStorageEnabled()) saveAllData();
    }

    let itemToDelete = 'mail'; // Merkt sich, was gelöscht wird

    function requestDeleteConfirmation() {
        itemToDelete = 'mail'; // Hier geht es um Mails
        const selectedCount = document.querySelectorAll('#page-mails .mail-item.selected').length;
        if (selectedCount === 0) return;

        const modalText = document.getElementById('delete-confirm-text');
        if (selectedCount === 1) {
            modalText.innerText = translations[currentLanguage].delete_confirm_single;
        } else {
            modalText.innerText = translations[currentLanguage].delete_confirm_multiple.replace('{count}', selectedCount);
        }

        const modalTitle = document.querySelector('#delete-modal .modal-title');
        if (modalTitle) {
            modalTitle.innerText = translations[currentLanguage].delete_title;
            modalTitle.setAttribute('data-translate', 'delete_title');
        }
        openDeleteModal();
    }

    function toggleSelectionMode() {
        const trashIcon = document.getElementById('mails-trash-icon');
        if (trashIcon) {
          trashIcon.classList.add('open-trash-anim');
          setTimeout(() => trashIcon.classList.remove('open-trash-anim'), 500);
        }

        const mailPage = document.getElementById('page-mails');
        mailPage.classList.toggle('selection-mode');
        isLongPress = false; // Sicherstellen, dass der Status zurückgesetzt wird
        const isInSelectionMode = mailPage.classList.contains('selection-mode');

        if (!isInSelectionMode) {
            document.querySelectorAll('.mail-item.selected').forEach(item => item.classList.remove('selected'));
        }
        updateSelectionCount();
    }

    function updateSelectionCount() {
        const selectedCount = document.querySelectorAll('.mail-item.selected').length;
        const countEl = document.getElementById('selection-count');
        const deleteBtn = document.getElementById('delete-selected-btn');
        countEl.innerText = selectedCount > 0 ? `${selectedCount}` : '';
        deleteBtn.style.color = selectedCount > 0 ? '#FF3B30' : 'var(--text-sub)';
        deleteBtn.style.cursor = selectedCount > 0 ? 'pointer' : 'default';
    }

    function addMailToDOM(newMailElement, isILearn = false) {
      if (!newMailElement.hasAttribute('data-mail-id')) {
        newMailElement.setAttribute('data-mail-id', 'mail-' + Date.now() + '-' + Math.floor(Math.random() * 10000));
      }

      attachMailEventListeners(newMailElement);

      const targetListSelector = isILearn ? '#ilearn-view .mail-list' : '#mails-view .mail-list';
      const mainList = document.querySelector(targetListSelector);
      if (mainList) mainList.prepend(newMailElement);

      const tabletMailCol = document.querySelector('.tablet-wrapper .mail-column');
      if (tabletMailCol) {
        const clone = newMailElement.cloneNode(true);
        attachMailEventListeners(clone);
        const tabletLists = tabletMailCol.querySelectorAll('.mail-list');
        if (isILearn && tabletLists.length > 1) {
          tabletLists[1].prepend(clone);
        } else if (!isILearn && tabletLists.length > 0) {
          tabletLists[0].prepend(clone);
        }
      }

      const mailsNavBtn = document.querySelectorAll('.nav-item')[2];
      if (mailsNavBtn) {
        const iconWrapper = mailsNavBtn.querySelector('.nav-icon-wrapper');
        if (iconWrapper) {
          // Laufenden Timer stoppen, falls direkt hintereinander E-Mails eintreffen
          if (iconWrapper.wiggleTimeout) {
            clearTimeout(iconWrapper.wiggleTimeout);
          }

          iconWrapper.classList.remove('new-mail-wiggle');
          void iconWrapper.offsetWidth; // Reflow erzwingen, um Animation neu zu starten
          iconWrapper.classList.add('new-mail-wiggle');

          // Klasse nach der Animation (0.6s) wieder entfernen, um Re-Trigger beim Tab-Wechsel zu verhindern
          iconWrapper.wiggleTimeout = setTimeout(() => {
            iconWrapper.classList.remove('new-mail-wiggle');
          }, 600);
        }
      }

      updateUnreadBadge();
      checkEmptyMailLists();
    }

    function executeTow() {
      if (mensaBalance < 14.99) {
        closeModal();
        setTimeout(openInsufficientFundsModal, 300);
        return;
      }
      mensaBalance -= 14.99;
      updateMensaBalance();
      closeModal();

      if (occupiedParkingSpots > 0) {
        occupiedParkingSpots--;
        updateParkingDisplay();
      }

      // Neue E-Mail erstellen
      const newMail = document.createElement('div');
      newMail.className = 'mail-item unread';

      newMail.innerHTML = `
        <div class="swipe-zone"></div>
        <div class="selection-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="mail-top">
          <span class="mail-sender" data-translate="tow_mail_sender">${translations[currentLanguage].tow_mail_sender}</span>
          <span class="mail-time" data-timestamp="${Date.now()}">${translations[currentLanguage].just_now}</span>
        </div>
        <div class="mail-subject" data-translate="tow_mail_subject">${translations[currentLanguage].tow_mail_subject}</div>
        <div class="mail-preview" data-translate="tow_mail_body">${translations[currentLanguage].tow_mail_body}</div>
      `;

      addMailToDOM(newMail, false);

      // Benachrichtigung anzeigen, wenn man sich nicht im Mail-Tab befindet
      const mailsPage = document.getElementById('page-mails');
      if (mailsPage && !mailsPage.classList.contains('active')) {
        const senderName = translations[currentLanguage].tow_mail_sender;
        showDropdownNotification(
          currentLanguage === 'de' ? `Neue E-Mail von ${senderName}` : `New email from ${senderName}`,
          false,
          () => {
            switchTab('page-mails', document.querySelectorAll('.nav-item')[2]);
            setTimeout(() => newMail.click(), 300); // Wartet kurz auf die Tab-Animation, öffnet dann die E-Mail
          }
        );
      }
    }

    function openRentalModal(title, due, loc, person, notes, element) {
      document.getElementById('rental-popup-title').innerText = title;
      document.getElementById('rental-popup-due').innerText = due;
      document.getElementById('rental-popup-loc').innerText = loc;
      document.getElementById('rental-popup-person').innerText = person;
      document.getElementById('rental-popup-notes').innerText = notes;

      const modal = document.getElementById('rental-modal');
      const buildings = modal.querySelectorAll('.building');
      buildings.forEach(b => b.classList.remove('active'));

      const buildingLetter = loc.charAt(0).toUpperCase();
      const targetBuilding = modal.querySelector('.rental-bldg-' + buildingLetter);

      if (loc.toLowerCase().includes('bibliothek') || loc.toLowerCase().includes('library')) {
        const bldgG = modal.querySelector('.rental-bldg-G');
        if(bldgG) bldgG.classList.add('active');
      } else if (buildingLetter === 'I' || loc.includes("ITC")) {
        const itc = modal.querySelector('.rental-bldg-ITC');
        if(itc) itc.classList.add('active');
      } else if (targetBuilding) {
        targetBuilding.classList.add('active');
      }

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);
    }

    function openContactModal(contact) {
      clearSearch();

      document.getElementById('contact-popup-name').innerText = contact.title;
      document.getElementById('contact-popup-faculty').innerText = contact.faculty || contact.loc;

      const actionBtn = document.getElementById('contact-action-btn');
      actionBtn.onclick = () => {
        closeModal();
        setTimeout(() => {
          document.getElementById('comp-to').value = contact.email || contact.title;
          document.getElementById('comp-subject').value = '';
          document.getElementById('comp-body').value = '';
          openComposeModal(false);
        }, 300);
      };

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('contact-modal').classList.add('show');
      }, 10);
    }

    function openIframeModal(url, title, showSettings = false) {
      document.getElementById('iframe-modal-title').innerText = title;
      document.getElementById('iframe-modal-content').src = url;

      const gearIcon = document.getElementById('iframe-settings-gear-icon');
      if (gearIcon) {
          gearIcon.style.display = showSettings ? 'block' : 'none';
      }

      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('iframe-modal').classList.add('show');
      }, 10);
    }

    // --- Such-Logik Start ---
    const searchData = [
      { id: 'widget-schedule', title: 'Stundenplan', page: 'page-home', loc: 'Home' },
      { id: 'widget-ects', title: 'Statistiken', page: 'page-home', loc: 'Home' },
      { id: 'widget-mensa', title: 'Mensa & Guthaben', page: 'page-home', loc: 'Home' },
      { id: 'widget-parking', title: 'Parkplatz', page: 'page-home', loc: 'Home' },
      { id: 'widget-rental', title: 'Verleih', page: 'page-home', loc: 'Home' },
      { id: 'widget-vpn', title: 'VPN', page: 'page-home', loc: 'Home' },
      { id: 'page-services', title: 'Dienste', page: 'page-services', loc: 'Menü' },
      { id: 'mails-view', title: 'Posteingang', page: 'page-mails', loc: 'Mails' },
      { id: 'profile-ects-card', title: 'Notenschnitt', page: 'page-profil', loc: 'Profil' },
      { type: 'contact', id: 'prof-schmidt', title: 'Prof. Dr. Schmidt', loc: 'Fakultät AN', email: 'prof.schmidt@th-deg.de', faculty: 'Angewandte Naturwissenschaften' },
      { type: 'contact', id: 'prof-weber', title: 'Prof. Weber', loc: 'Fakultät EI', email: 'prof.weber@th-deg.de', faculty: 'Elektrotechnik, Medientechnik & Informatik' },
      { type: 'contact', id: 'prof-meier', title: 'Prof. Dr. Meier', loc: 'Fakultät AW', email: 'prof.meier@th-deg.de', faculty: 'Angewandte Wirtschaftswissenschaften' },
      { type: 'contact', id: 'prof-bauer', title: 'Prof. Dr. Bauer', loc: 'Fakultät B', email: 'prof.bauer@th-deg.de', faculty: 'Bauingenieurwesen & Umwelttechnik' },
      { type: 'contact', id: 'prof-fuchs', title: 'Prof. Dr. Fuchs', loc: 'Fakultät M', email: 'prof.fuchs@th-deg.de', faculty: 'Maschinenbau & Mechatronik' },
      { type: 'contact', id: 'it-support', title: 'IT-Support', loc: 'Service', email: 'it-support@th-deg.de', faculty: 'Zentrale Dienste' },
      { type: 'contact', id: 'pruefungsamt', title: 'Prüfungsamt', loc: 'Service', email: 'pruefungsamt@th-deg.de', faculty: 'Studienzentrum' },
      { type: 'contact', id: 'career-service', title: 'Career Service', loc: 'Service', email: 'career-service@th-deg.de', faculty: 'Zentrale Dienste' },
      { type: 'contact', id: 'asta', title: 'AStA', loc: 'Studentenvertretung', email: 'asta@th-deg.de', faculty: 'Allgemeiner Studierendenausschuss' },
      { type: 'contact', id: 'prof-wagner', title: 'Prof. Dr. Wagner', loc: 'Fakultät NU', email: 'prof.wagner@th-deg.de', faculty: 'Naturwissenschaften & Wirtschaftsingenieurwesen' },
      { type: 'contact', id: 'prof-mueller', title: 'Prof. Dr. Müller', loc: 'Fakultät WI', email: 'prof.mueller@th-deg.de', faculty: 'Wirtschaftsinformatik' },
      { type: 'contact', id: 'prof-becker', title: 'Prof. Dr. Becker', loc: 'Fakultät AGW', email: 'prof.becker@th-deg.de', faculty: 'Angewandte Gesundheitswissenschaften' },
      { type: 'contact', id: 'international-office', title: 'International Office', loc: 'Service', email: 'international@th-deg.de', faculty: 'Internationales' },
      { type: 'contact', id: 'studierendenwerk', title: 'Studierendenwerk', loc: 'Service', email: 'info@stwno.de', faculty: 'Studierendenwerk Niederbayern/Oberpfalz' },
      { type: 'contact', id: 'bibliothek-kontakt', title: 'Bibliothek (Kontakt)', loc: 'Service', email: 'bibliothek@th-deg.de', faculty: 'Zentrale Dienste' },
      { type: 'contact', id: 'sprachenzentrum', title: 'Sprachenzentrum', loc: 'Service', email: 'sprachenzentrum@th-deg.de', faculty: 'Zentrale Dienste' },
      { type: 'contact', id: 'rechenzentrum', title: 'Rechenzentrum (ITC)', loc: 'Service', email: 'itc@th-deg.de', faculty: 'Zentrale Dienste' },
      { id: 'page-services', title: 'IT-Service (Dienste)', page: 'page-services', loc: 'Menü' },
      { id: 'page-services', title: 'Anträge (Dienste)', page: 'page-services', loc: 'Menü' },
      { id: 'page-services', title: 'Hilfe & FAQ', page: 'page-services', loc: 'Menü' }
    ];

    let searchHistory = JSON.parse(localStorage.getItem('thd_search_history') || '[]');

    function addToHistory(item) {
      // Entferne Element falls es schon im Verlauf ist, damit es ganz oben neu auftaucht
      searchHistory = searchHistory.filter(i => i.title !== item.title);
      searchHistory.unshift(item);
      if (searchHistory.length > 5) searchHistory.pop(); // Maximal 5 Einträge speichern
      if (isStorageEnabled()) {
        localStorage.setItem('thd_search_history', JSON.stringify(searchHistory));
      }
      renderSearchHistory();
    }

    function requestSearchClearConfirmation() {
      // Deckel öffnen und offen lassen
      document.getElementById('search-trash-icon')?.classList.add('lid-stay-open');
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('clear-search-modal').classList.add('show');
      }, 10);
    }

    function confirmClearSearch() {
      clearSearchHistory();
      closeModal();
      if (isStorageEnabled()) saveAllData();
    }

    function clearSearchHistory() {
      searchHistory = [];
      if (isStorageEnabled()) {
        localStorage.removeItem('thd_search_history');
      }
      renderSearchHistory();
    }

    function renderSearchHistory() {
      const container = document.getElementById('search-history-list');
      if (!container) return;
      container.innerHTML = '';

      if (searchHistory.length === 0) {
        container.innerHTML = `<div style="color: var(--text-sub); font-size: 13px; text-align: center; padding: 40px 10px;" data-translate="search_history_empty">${translations[currentLanguage].search_history_empty}</div>`;
        return;
      }

      searchHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `<span class="search-result-title">${item.title}</span><span class="search-result-loc">${item.loc}</span>`;

        if (item.type === 'contact') {
          div.onclick = () => {
            addToHistory(item); // Klick aus dem Verlauf aktualisiert ihn ebenfalls wieder nach oben
            openContactModal(item);
          };
        } else {
          div.onclick = () => {
            addToHistory(item); // Klick aus dem Verlauf aktualisiert ihn ebenfalls wieder nach oben
            jumpToElement(item.page, item.id);
          };
        }
        container.appendChild(div);
      });
    }

    function performSearch() {
      const q = document.getElementById('search-input').value.toLowerCase();
      const container = document.getElementById('search-results-container');
      const suggestions = document.getElementById('search-suggestions');
      const clearBtn = document.getElementById('search-clear-btn');

      if(clearBtn) {
        clearBtn.style.display = q.length > 0 ? 'block' : 'none';
      }

      container.innerHTML = '';

      if(!q) {
        if(suggestions) suggestions.style.display = 'block';
        return;
      }

      if(suggestions) suggestions.style.display = 'none';

      searchData.filter(item => item.title.toLowerCase().includes(q)).forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `<span class="search-result-title">${item.title}</span><span class="search-result-loc">${item.loc}</span>`;

        if (item.type === 'contact') {
          div.onclick = () => {
            addToHistory(item);
            openContactModal(item);
          };
        } else {
          div.onclick = () => {
            addToHistory(item);
            jumpToElement(item.page, item.id);
          };
        }
        container.appendChild(div);
      });
    }

    function jumpToElement(pageId, elementId) {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = '';
        performSearch();
      }

      if (pageId === 'page-services') {
        openServicesModal();
        return;
      }

      const navIndex = pagesList.indexOf(pageId);
      if(navIndex > -1) switchTab(pageId, document.querySelectorAll('.nav-item')[navIndex]);

      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-anim');
                  setTimeout(() => el.classList.remove('highlight-anim'), 1400);
        }
      }, 300);
    }

    function clearSearch() {
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = '';
        performSearch();
      }
    }
    // --- Such-Logik Ende ---

    // Sprach- und Übersetzungslogik
    const translations = {
      de: {
        // Navbar
        mails_nav: "Mails",
        home_nav: "Home",
        search_nav: "Suche",
        news_nav: "News",
        search_header: "Suche",
        news_header: "Veranstaltungen",
        news_no_favorites: "Keine Favoriten markiert.",
        search_placeholder: "Widgets & Elemente suchen...",
        search_suggestions: "Vorschläge",
        search_history: "Zuletzt gesucht",
        search_history_empty: "Noch keine Suchanfragen",
        profile_nav: "Profil",
        clear_search_title: "Suchverlauf leeren",
        clear_search_confirm: "Möchtest du deinen gesamten Suchverlauf löschen?",
        // Mails Page
        mails_header: "Mail",
        ilearn_header: "iLearn",
        // Compose Modal
        compose_title: "Neue E-Mail",
        compose_to: "An:",
        compose_subject: "Betreff:",
        compose_body: "Nachricht...",
        compose_cancel: "Abbrechen",
        compose_send: "Senden",
        // Email Detail Modal
        email_detail_reply: "Antworten",
        // Home Page
        dashboard_header: "Dashboard",
        ects_label: "ECTS",
        mensa_balance_label: "Karten-Guthaben",
        parking_title: "Studierendenparkplatz",
        parking_status_full: "Fast voll",
        parking_status_medium: "Gut besucht",
        parking_status_low: "Viele frei",
        parking_text: "Ca. {spots} von 200 Plätzen belegt",
        parking_modal_title: "Auslastung",
        parking_modal_subtitle: "Heute",
        parking_forecast: "Prognose",
        vpn_title: "Hochschul-VPN",
        vpn_status_disconnected: "Getrennt",
        vpn_status_connected: "Verbunden",
        vpn_notif_title: "VPN Verbunden",
        vpn_notif_body: "Die Verbindung zum Hochschulnetzwerk wurde hergestellt.",
        widget_settings_title: "Widgets anpassen",
        widget_ects: "Statistiken",
        widget_schedule: "Stundenplan",
        widget_mensa: "Mensa",
        widget_parking: "Parkplatz",
        widget_rental: "Verleih",
        widget_vpn: "VPN",
        services_modal_title: "Dienste",
        widget_services: "Dienste",
        widget_weather: "Wetter",
        widget_weather_city: "Deggendorf",
        widget_weather_desc: "Leicht bewölkt",
        widget_todo: "To-Do Liste",
        schedule_modal_title: "Gesamter Stundenplan",
        schedule_settings_title: "Studiengang",
        mensa_menu_title: "Speiseplan",
        back_button: "Zurück",
        food_desc: "Beschreibung",
        schedule_week_this: "Diese Woche",
        schedule_week_next: "Nächste Woche",
        schedule_week_last: "Letzte Woche",
        schedule_week_in: "In {n} Wochen",
        schedule_week_ago: "Vor {n} Wochen",
        food_allergens: "Allergene",
        food_prices: "Preise",
        rental_title: "Verleih",
        rental_books: "Bücher",
        rental_tech: "Technik",
        rental_books_empty: "Keine Bücher ausgeliehen.",
        rental_tech_due: "In 2 Tagen",
        rental_tech_due_today: "Heute",
        rental_modal_location: "Rückgabeort",
        rental_modal_person: "Zuständig",
        rental_modal_notes: "Zubehör / Notizen",
        // Profile Page
        profile_header: "Profil",
        profile_major: "Medientechnik",
        profile_semester: "4. Semester",
        stats_ects_total: "ECTS Gesamt",
        stats_gpa: "Notenschnitt",
        home_studied_label: "Tage studiert",
        home_remaining_label: "Tage übrig",
        study_time_title: "Studienzeit",
        study_time_studied: "460 Tage studiert",
        study_time_remaining: "635 Tage übrig",
        study_time_extra: "+180 Tage (1 Extra-Semester)",
        all_grades_title: "Alle Noten",
        // Course Modal
        course_modal_room: "Raum",
        edit_name_title: "Name bearbeiten",
        course_modal_tasks: "Aufgaben",
        course_modal_to_ilearn: "Zu iLearn",
        event_location: "Ort",
        event_desc: "Beschreibung",
        // Study Time Modal
        study_time_modal_title: "Studienzeit anpassen",
        study_time_current: "Aktuelles Semester",
        study_time_total: "Regelstudienzeit",
        study_time_extra_input: "Zusätzliche Semester",
        study_time_studied_dyn: "{days} Tage studiert",
        study_time_remaining_dyn: "{days} Tage übrig",
        study_time_extra_dyn: "+{days} Tage ({n} Extra-Semester)",
        save_button: "Speichern",
        grade_modal_date: "Prüfungsdatum",
        grade_modal_examiner: "Prüfer/in",
        grade_modal_participants: "Angem. / Teilg.",
        grade_modal_average: "Notendurchschnitt",
        grade_modal_distribution: "Notenverteilung",
        // Generic
        close_button: "Schließen",
        cancel_button: "Abbrechen",
        select_day_button: "Auswählen",
         continue_button: "Weiter",
        // GPA Modal
        gpa_modal_title: "Notenschnitt",
        gpa_modal_question: "Sind Sie zufrieden mit Ihrer Note?",
        gpa_modal_yes: "Ja",
        // Topup Modal
        topup_modal_title: "Guthaben aufladen",
        topup_modal_question: "Möchten Sie Ihr Mensa-Guthaben aufladen?",
        topup_confirm_title: "Kaufbestätigung",
        topup_confirm_amount: "Betrag:",
        topup_confirm_method: "Zahlungsart:",
        topup_confirm_fee: "Gebühren:",
        topup_confirm_total: "Gesamt:",
        topup_confirm_buy: "Kostenpflichtig aufladen",
        // Tow Modal
        tow_modal_title: "Parkplatz freiräumen",
        tow_modal_question: "Möchten Sie ein Auto verschwinden lassen?",
        tow_mail_sender: "Wütender Kommilitone",
        tow_mail_subject: "MEIN GOLFFF!!!",
        tow_mail_body: "Sag mal spinnst du komplett?! Hast du ernsthaft mein Auto abschleppen lassen?! Das kostet mich über 200€! Ich finde heraus wer du bist!!",
        just_now: "Gerade eben",
        time_mins_ago: "Vor {n} Min",
        time_hours_ago: "Vor {n} Std",
        time_yesterday: "Gestern",
        time_days_ago: "Vor {n} Tagen",
        // Delete Modal
        delete_title: "E-Mail löschen",
        delete_ects_title: "ECTS zurücksetzen",
        delete_confirm_single: "Möchtest du diese E-Mail wirklich löschen?",
        delete_confirm_multiple: "Möchtest du die {count} ausgewählten E-Mails wirklich löschen?",
        delete_button: "Löschen",
        empty_mails: "Keine Nachrichten vorhanden",
        // Settings Modal
        settings_title: "Einstellungen",
        settings_theme: "Design",
        theme_light: "Hell",
        theme_dark: "Dunkel",
        theme_oled: "Anti-Ghosting",
        language_label: "Sprache",
        settings_storage: "Daten lokal speichern",
        settings_real_mode: "Echte Daten\n(Mensa, Stundenplan, KI-Mails, Events)",
        ok_button: "OK",
        settings_privacy: "Privatmodus",
        info_privacy_title: "Privatmodus",
        info_privacy_desc: "Verbirgt sensible Daten wie Noten, ECTS, Guthaben und deinen Namen durch einen Unschärfe-Effekt.",
        setup_title: "Willkommen",
        setup_subtitle: "Bitte wähle deine bevorzugten Einstellungen.",
        info_storage_title: "Daten lokal speichern",
        info_storage_desc: "Speichert deine Einstellungen, Änderungen am Dashboard und andere Daten lokal auf deinem Gerät. Wenn deaktiviert, wird alles beim Schließen der App zurückgesetzt.",
        info_real_mode_title: "Echte Daten",
        info_real_mode_desc: "Lädt den echten Speiseplan der Mensa Deggendorf, den aktuellen iCal-Stundenplan, echte Hochschul-Veranstaltungen und aktiviert die KI-Antworten bei E-Mails. Wenn deaktiviert, werden Dummy-Daten zu Demonstrationszwecken angezeigt.",
        setup_show_again: "Beim Start anzeigen",
        info_show_again_title: "Dialog anzeigen",
        info_show_again_desc: "Wenn aktiviert, erscheint dieser Willkommensbildschirm bei jedem App-Start erneut. So kannst du schnell zwischen dem Offline- und Live-Modus wechseln.",
        setup_install_hint: "Für das beste Erlebnis empfehlen wir, die App unter Android zu installieren oder unter iOS zum Startbildschirm hinzuzufügen.",
        settings_about: "Über diese App",
        about_title: "Über die THD App",
        about_desc: "Eine moderne THD APP für Studierende, entwickelt im Medientechnik-Studium.",
        about_github: "Zum GitHub Repository",
        settings_close: "Schließen",
        schedule_no_lectures_on: "Keine Vorlesungen am {day}",
        schedule_done_today: "Für heute geschafft! 🎉",
        schedule_done_desc: "Alle Vorlesungen sind beendet.",
        schedule_no_lectures: "Heute keine Vorlesungen",
        schedule_no_lectures_day: "Keine Vorlesungen an diesem Tag",
        schedule_tap_for_plan: "Tippe für den Plan",
        schedule_next_day: "Nächster Tag ({day}, {date})",
        mensa_no_menu: "Heute kein Speiseplan",
        mensa_to_menu: "Zum Speiseplan",
        mensa_error: "Fehler beim Laden",
        mensa_no_meals: "An diesem Tag keine Gerichte verfügbar",
        vpn_speed_title: "VPN Geschwindigkeit",
        service_tech: "IT-Service",
        service_schedule: "Stundenplan",
        service_requests: "Anträge",
        service_ilearn: "iLearn",
        service_library: "Bibliothek",
        service_faq: "Hilfe & FAQ",
        search_sugg_prof: "Dozierende",
        search_sugg_mensa: "Mensa",
        search_sugg_vpn: "VPN",
        search_sugg_grades: "Noten",
        chart_grades_tooltip: "{n} Noten",
        chart_cars_tooltip: "{n} Autos",
        settings_ai_generate: "KI Daten generieren",
        ai_generating: "KI generiert Daten...",
        ai_generated: "Daten erfolgreich generiert!",
        ai_error: "Fehler bei der KI-Generierung.",
        info_ai_generate_title: "KI Daten generieren",
        info_ai_generate_desc: "Erstellt mithilfe von künstlicher Intelligenz (Gemini) zufällige, realistische Studiendaten (Noten, ECTS, Mensa-Guthaben etc.) zu Demonstrationszwecken. Kann nur einmal pro Minute genutzt werden."
      },
      en: {
        // Navbar
        mails_nav: "Mails",
        home_nav: "Home",
        search_nav: "Search",
        news_nav: "News",
        search_header: "Search",
        news_header: "Events",
        news_no_favorites: "No favorites marked.",
        search_placeholder: "Search widgets & items...",
        search_suggestions: "Suggestions",
        search_history: "Recent searches",
        search_history_empty: "No recent searches",
        profile_nav: "Profile",
        clear_search_title: "Clear History",
        clear_search_confirm: "Do you want to clear your entire search history?",
        // Mails Page
        mails_header: "Mail",
        ilearn_header: "iLearn",
        // Compose Modal
        compose_title: "New Email",
        compose_to: "To:",
        compose_subject: "Subject:",
        compose_body: "Message...",
        compose_cancel: "Cancel",
        compose_send: "Send",
        // Email Detail Modal
        email_detail_reply: "Reply",
        // Home Page
        dashboard_header: "Dashboard",
        ects_label: "ECTS",
        mensa_balance_label: "Card Balance",
        parking_title: "Student Parking",
        parking_status_full: "Almost full",
        parking_status_medium: "Busy",
        parking_status_low: "Many free",
        parking_text: "Approx. {spots} of 200 spots taken",
        parking_modal_title: "Utilization",
        parking_modal_subtitle: "Today",
        parking_forecast: "Forecast",
        vpn_title: "University VPN",
        vpn_status_disconnected: "Disconnected",
        vpn_status_connected: "Connected",
        vpn_notif_title: "VPN Connected",
        vpn_notif_body: "Connection to the university network has been established.",
        widget_settings_title: "Edit Widgets",
        widget_ects: "Statistics",
        widget_schedule: "Schedule",
        widget_mensa: "Cafeteria",
        widget_parking: "Parking",
        widget_rental: "Rentals",
        widget_vpn: "VPN",
        services_modal_title: "Services",
        widget_services: "Services",
        widget_weather: "Weather",
        widget_weather_city: "Deggendorf",
        widget_weather_desc: "Partly cloudy",
        widget_todo: "To-Do List",
        schedule_modal_title: "Full Schedule",
        schedule_settings_title: "Study Group",
        mensa_menu_title: "Menu",
        back_button: "Back",
        food_desc: "Description",
        schedule_week_this: "This Week",
        schedule_week_next: "Next Week",
        schedule_week_last: "Last Week",
        schedule_week_in: "In {n} Weeks",
        schedule_week_ago: "{n} Weeks ago",
        food_allergens: "Allergens",
        food_prices: "Prices",
        rental_title: "Rentals",
        rental_books: "Books",
        rental_tech: "Tech",
        rental_books_empty: "No books borrowed.",
        rental_tech_due: "In 2 days",
        rental_tech_due_today: "Today",
        rental_modal_location: "Return Location",
        rental_modal_person: "Contact Person",
        rental_modal_notes: "Accessories / Notes",
        // Profile Page
        profile_header: "Profile",
        profile_major: "Media Technology",
        profile_semester: "4th Semester",
        stats_ects_total: "Total ECTS",
        stats_gpa: "GPA",
        home_studied_label: "Days studied",
        home_remaining_label: "Days remaining",
        study_time_title: "Study Time",
        study_time_studied: "460 days studied",
        study_time_remaining: "635 days remaining",
        study_time_extra: "+180 days (1 extra semester)",
        all_grades_title: "All Grades",
        // Course Modal
        course_modal_room: "Room",
        edit_name_title: "Edit Name",
        course_modal_tasks: "Tasks",
        course_modal_to_ilearn: "Go to iLearn",
        event_location: "Location",
        event_desc: "Description",
        // Study Time Modal
        study_time_modal_title: "Adjust Study Time",
        study_time_current: "Current Semester",
        study_time_total: "Standard Duration",
        study_time_extra_input: "Extra Semesters",
        study_time_studied_dyn: "{days} days studied",
        study_time_remaining_dyn: "{days} days remaining",
        study_time_extra_dyn: "+{days} days ({n} extra semesters)",
        save_button: "Save",
        grade_modal_date: "Exam Date",
        grade_modal_examiner: "Examiner",
        grade_modal_participants: "Reg. / Part.",
        grade_modal_average: "Average Grade",
        grade_modal_distribution: "Grade Distribution",
        // Generic
        close_button: "Close",
        cancel_button: "Cancel",
        select_day_button: "Select",
        continue_button: "Continue",
        // GPA Modal
        gpa_modal_title: "GPA",
        gpa_modal_question: "Are you satisfied with your grade?",
        gpa_modal_yes: "Yes",
        // Topup Modal
        topup_modal_title: "Top Up Balance",
        topup_modal_question: "Do you want to top up your cafeteria balance?",
        topup_confirm_title: "Purchase Confirmation",
        topup_confirm_amount: "Amount:",
        topup_confirm_method: "Payment Method:",
        topup_confirm_fee: "Fees:",
        topup_confirm_total: "Total:",
        topup_confirm_buy: "Confirm Purchase",
        // Tow Modal
        tow_modal_title: "Clear Parking Space",
        tow_modal_question: "Do you want to make a car disappear?",
        tow_mail_sender: "Angry Classmate",
        tow_mail_subject: "MY GOLF!!!",
        tow_mail_body: "Are you completely out of your mind?! Did you seriously get my car towed?! This is costing me over 200€! I will find out who you are!!",
        just_now: "Just now",
        time_mins_ago: "{n} mins ago",
        time_hours_ago: "{n} hours ago",
        time_yesterday: "Yesterday",
        time_days_ago: "{n} days ago",
        // Delete Modal
        delete_title: "Delete Email",
        delete_ects_title: "Reset ECTS",
        delete_confirm_single: "Are you sure you want to delete this email?",
        delete_confirm_multiple: "Are you sure you want to delete the {count} selected emails?",
        delete_button: "Delete",
        empty_mails: "No messages available",
        // Settings Modal
        settings_title: "Settings",
        settings_theme: "Theme",
        theme_light: "Light",
        theme_dark: "Dark",
        theme_oled: "Anti-Ghosting",
        language_label: "Language",
        settings_storage: "Save data locally",
        settings_real_mode: "Real Data\n(Mensa, Schedule, AI Mails, Events)",
        ok_button: "OK",
        settings_privacy: "Privacy Mode",
        info_privacy_title: "Privacy Mode",
        info_privacy_desc: "Blurs sensitive data such as grades, ECTS, balance, and your name to protect your privacy.",
        setup_title: "Welcome",
        setup_subtitle: "Please choose your preferred settings.",
        info_storage_title: "Save data locally",
        info_storage_desc: "Saves your settings, dashboard modifications, and other data locally on your device. If disabled, everything resets when you close the app.",
        info_real_mode_title: "Real Data",
        info_real_mode_desc: "Loads the real cafeteria menu for Deggendorf, the current iCal schedule, real university events, and enables AI email replies. If disabled, dummy data is shown for demonstration purposes.",
        setup_show_again: "Show on startup",
        info_show_again_title: "Show dialog",
        info_show_again_desc: "If enabled, this welcome screen will appear on every app startup. Useful to quickly switch between offline and live modes.",
        setup_install_hint: "For the best experience, we recommend installing the app on Android or adding it to your home screen on iOS.",
        settings_about: "About this App",
        about_title: "About THD App",
        about_desc: "A modern THD APP for students, developed during Media Technology studies.",
        about_github: "Go to GitHub repository",
        settings_close: "Finnish",
        schedule_no_lectures_on: "No lectures on {day}",
        schedule_done_today: "Done for today! 🎉",
        schedule_done_desc: "All lectures have ended.",
        schedule_no_lectures: "No lectures today",
        schedule_no_lectures_day: "No lectures on this day",
        schedule_tap_for_plan: "Tap for schedule",
        schedule_next_day: "Next Day ({day}, {date})",
        mensa_no_menu: "No menu today",
        mensa_to_menu: "To the menu",
        mensa_error: "Error loading",
        mensa_no_meals: "No meals available on this day",
        vpn_speed_title: "VPN Speed",
        service_tech: "IT Services",
        service_schedule: "Schedule",
        service_requests: "Requests",
        service_ilearn: "iLearn",
        service_library: "Library",
        service_faq: "Help & FAQ",
        search_sugg_prof: "Professors",
        search_sugg_mensa: "Cafeteria",
        search_sugg_vpn: "VPN",
        search_sugg_grades: "Grades",
        chart_grades_tooltip: "{n} Grades",
        chart_cars_tooltip: "{n} Cars",
        settings_ai_generate: "Generate AI Data",
        ai_generating: "AI is generating data...",
        ai_generated: "Data successfully generated!",
        ai_error: "Error during AI generation.",
        info_ai_generate_title: "Generate AI Data",
        info_ai_generate_desc: "Uses Artificial Intelligence (Gemini) to generate random, realistic study data (grades, ECTS, cafeteria balance, etc.) for demonstration purposes. Can only be used once per minute."
      },
      fi: {
        // Navbar
        mails_nav: "Sähköpostit",
        home_nav: "Koti",
        search_nav: "Haku",
        news_nav: "Uutiset",
        search_header: "Haku",
        news_header: "Tapahtumat",
        news_no_favorites: "Ei suosikkeja merkitty.",
        search_placeholder: "Etsi widgettejä...",
        search_suggestions: "Ehdotukset",
        search_history: "Viimeisimmät haut",
        search_history_empty: "Ei äskettäisiä hakuja",
        profile_nav: "Profiili",
        clear_search_title: "Tyhjennä historia",
        clear_search_confirm: "Haluatko tyhjentää koko hakuhistoriasi?",
        // Mails Page
        mails_header: "Posti",
        ilearn_header: "iLearn",
        // Compose Modal
        compose_title: "Uusi sähköposti",
        compose_to: "Vastaanottaja:",
        compose_subject: "Aihe:",
        compose_body: "Viesti...",
        compose_cancel: "Peruuta",
        compose_send: "Lähetä",
        // Email Detail Modal
        email_detail_reply: "Vastaa",
        // Home Page
        dashboard_header: "Kojelauta",
        ects_label: "OP",
        mensa_balance_label: "Kortin saldo",
        parking_title: "Opiskelijoiden pysäköinti",
        parking_status_full: "Melkein täynnä",
        parking_status_medium: "Varattu",
        parking_status_low: "Paljon vapaita",
        parking_text: "Noin {spots}/200 paikkaa varattu",
        parking_modal_title: "Käyttöaste",
        parking_modal_subtitle: "Tänään",
        parking_forecast: "Ennuste",
        vpn_title: "Yliopiston VPN",
        vpn_status_disconnected: "Katkaistu",
        vpn_status_connected: "Yhdistetty",
        vpn_notif_title: "VPN yhdistetty",
        vpn_notif_body: "Yhteys yliopiston verkkoon on muodostettu.",
        widget_settings_title: "Muokkaa widgettejä",
        widget_ects: "Tilastot",
        widget_schedule: "Lukujärjestys",
        widget_mensa: "Ruokala",
        widget_parking: "Pysäköinti",
        widget_rental: "Vuokraus",
        widget_vpn: "VPN",
        services_modal_title: "Palvelut",
        widget_services: "Palvelut",
        widget_weather: "Sää",
        widget_weather_city: "Deggendorf",
        widget_weather_desc: "Puolipilvistä",
        widget_todo: "Tehtävälista",
        schedule_modal_title: "Koko lukujärjestys",
        schedule_settings_title: "Opintoryhmä",
        mensa_menu_title: "Ruokalista",
        back_button: "Takaisin",
        food_desc: "Kuvaus",
        schedule_week_this: "Tällä viikolla",
        schedule_week_next: "Ensi viikolla",
        schedule_week_last: "Viime viikolla",
        schedule_week_in: "{n} viikon kuluttua",
        schedule_week_ago: "{n} viikkoa sitten",
        food_allergens: "Allergeenit",
        food_prices: "Hinnat",
        rental_title: "Vuokraus",
        rental_books: "Kirjat",
        rental_tech: "Tekniikka",
        rental_books_empty: "Ei lainattuja kirjoja.",
        rental_tech_due: "2 päivän kuluttua",
        rental_tech_due_today: "Tänään",
        rental_modal_location: "Palautuspaikka",
        rental_modal_person: "Yhteyshenkilö",
        rental_modal_notes: "Tarvikkeet / Huomautukset",
        // Profile Page
        profile_header: "Profiili",
        profile_major: "Mediatekniikka",
        profile_semester: "4. lukukausi",
        stats_ects_total: "OP yhteensä",
        stats_gpa: "Keskiarvo",
        home_studied_label: "Opiskellut päivät",
        home_remaining_label: "Jäljellä olevat päivät",
        study_time_title: "Opiskeluaika",
        study_time_studied: "460 päivää opiskeltu",
        study_time_remaining: "635 päivää jäljellä",
        study_time_extra: "+180 päivää (1 lisälukukausi)",
        all_grades_title: "Kaikki arvosanat",
        // Course Modal
        course_modal_room: "Huone",
        edit_name_title: "Muokkaa nimeä",
        course_modal_tasks: "Tehtävät",
        course_modal_to_ilearn: "Siirry iLearniin",
        event_location: "Sijainti",
        event_desc: "Kuvaus",
        // Study Time Modal
        study_time_modal_title: "Säädä opiskeluaikaa",
        study_time_current: "Nykyinen lukukausi",
        study_time_total: "Normaali kesto",
        study_time_extra_input: "Lisälukukaudet",
        study_time_studied_dyn: "{days} päivää opiskeltu",
        study_time_remaining_dyn: "{days} päivää jäljellä",
        study_time_extra_dyn: "+{days} päivää ({n} lisälukukautta)",
        save_button: "Tallenna",
        grade_modal_date: "Tenttipäivä",
        grade_modal_examiner: "Tarkastaja",
        grade_modal_participants: "Ilm. / Osall.",
        grade_modal_average: "Arvosanojen keskiarvo",
        grade_modal_distribution: "Arvosanajakauma",
        // Generic
        close_button: "Sulje",
        cancel_button: "Peruuta",
        select_day_button: "Valitse",
        continue_button: "Jatka",
        // GPA Modal
        gpa_modal_title: "Keskiarvo",
        gpa_modal_question: "Oletko tyytyväinen arvosanaasi?",
        gpa_modal_yes: "Kyllä",
        // Topup Modal
        topup_modal_title: "Lataa saldoa",
        topup_modal_question: "Haluatko ladata ruokalan saldoa?",
        topup_confirm_title: "Ostovahvistus",
        topup_confirm_amount: "Määrä:",
        topup_confirm_method: "Maksutapa:",
        topup_confirm_fee: "Maksut:",
        topup_confirm_total: "Yhteensä:",
        topup_confirm_buy: "Vahvista osto",
        // Tow Modal
        tow_modal_title: "Tyhjennä pysäköintipaikka",
        tow_modal_question: "Haluatko saada auton katoamaan?",
        tow_mail_sender: "Vihainen opiskelukaveri",
        tow_mail_subject: "MINUN GOLF!!!",
        tow_mail_body: "Oletko aivan hullu?! Hinautitko todella autoni pois?! Tämä maksaa minulle yli 200€! Selvitän, kuka olet!!",
        just_now: "Juuri nyt",
        time_mins_ago: "{n} min sitten",
        time_hours_ago: "{n} t sitten",
        time_yesterday: "Eilen",
        time_days_ago: "{n} päivää sitten",
        // Delete Modal
        delete_title: "Poista sähköposti",
        delete_ects_title: "Nollaa OP",
        delete_confirm_single: "Haluatko varmasti poistaa tämän sähköpostin?",
        delete_confirm_multiple: "Haluatko varmasti poistaa {count} valittua sähköpostia?",
        delete_button: "Poista",
        empty_mails: "Ei viestejä",
        // Settings Modal
        settings_title: "Asetukset",
        settings_theme: "Teema",
        theme_light: "Vaalea",
        theme_dark: "Tumma",
        theme_oled: "Anti-Ghosting",
        language_label: "Kieli",
        settings_storage: "Tallenna tiedot paikallisesti",
        settings_real_mode: "Oikeat tiedot\n(Ruokala, Lukujärjestys, AI-postit, Tapahtumat)",
        ok_button: "OK",
        settings_privacy: "Yksityisyystila",
        info_privacy_title: "Yksityisyystila",
        info_privacy_desc: "Sumentaa arkaluontoiset tiedot, kuten arvosanat, opintopisteet, saldon ja nimesi, yksityisyytesi suojaamiseksi.",
        setup_title: "Tervetuloa",
        setup_subtitle: "Valitse haluamasi asetukset.",
        info_storage_title: "Tallenna tiedot paikallisesti",
        info_storage_desc: "Tallentaa asetuksesi, kojelaudan muokkaukset ja muut tiedot paikallisesti laitteellesi. Jos tämä on pois päältä, kaikki nollautuu, kun suljet sovelluksen.",
        info_real_mode_title: "Oikeat tiedot",
        info_real_mode_desc: "Lataa Deggendorfin todellisen ruokalistan, nykyisen iCal-lukujärjestyksen, todelliset yliopiston tapahtumat ja ottaa käyttöön tekoälyn sähköpostivastaukset. Jos pois päältä, näytetään demotietoja esittelytarkoituksessa.",
        setup_show_again: "Näytä käynnistettäessä",
        info_show_again_title: "Näytä valintaikkuna",
        info_show_again_desc: "Jos otettu käyttöön, tämä tervetulonäyttö tulee näkyviin joka kerta, kun sovellus käynnistetään. Hyödyllinen vaihdettaessa offline- ja live-tilojen välillä.",
        setup_install_hint: "Parhaan kokemuksen saamiseksi suosittelemme asentamaan sovelluksen Androidilla tai lisäämään sen aloitusnäyttöön iOS:ssä.",
        settings_about: "Tietoja tästä sovelluksesta",
        about_title: "Tietoja THD App",
        about_desc: "Moderni THD-SOVELLUS opiskelijoille, kehitetty mediatekniikan opintojen aikana.",
        about_github: "Siirry GitHub-arkistoon",
        settings_close: "Sulje",
        schedule_no_lectures_on: "Ei luentoja {day}",
        schedule_done_today: "Valmis tältä päivältä! 🎉",
        schedule_done_desc: "Kaikki luennot ovat päättyneet.",
        schedule_no_lectures: "Ei luentoja tänään",
        schedule_no_lectures_day: "Ei luentoja tänä päivänä",
        schedule_tap_for_plan: "Napauta aikataulua",
        schedule_next_day: "Seuraava päivä ({day}, {date})",
        mensa_no_menu: "Ei ruokalistaa tänään",
        mensa_to_menu: "Ruokalistaan",
        mensa_error: "Virhe ladattaessa",
        mensa_no_meals: "Ei aterioita saatavilla tänä päivänä",
        vpn_speed_title: "VPN Nopeus",
        service_tech: "IT-palvelut",
        service_schedule: "Lukujärjestys",
        service_requests: "Pyynnöt",
        service_ilearn: "iLearn",
        service_library: "Kirjasto",
        service_faq: "Apua & FAQ",
        search_sugg_prof: "Professorit",
        search_sugg_mensa: "Ruokala",
        search_sugg_vpn: "VPN",
        search_sugg_grades: "Arvosanat",
        chart_grades_tooltip: "{n} Arvosanaa",
        chart_cars_tooltip: "{n} Autoa",
        settings_ai_generate: "Luo tekoälytiedot",
        ai_generating: "Tekoäly luo tietoja...",
        ai_generated: "Tiedot luotu onnistuneesti!",
        ai_error: "Virhe tekoälyn luonnissa.",
        info_ai_generate_title: "Luo tekoälytiedot",
        info_ai_generate_desc: "Käyttää tekoälyä (Gemini) satunnaisten, realististen opiskelutietojen (arvosanat, OP, ruokalan saldo jne.) luomiseen esittelytarkoituksessa. Voidaan käyttää vain kerran minuutissa."
      }
    };

    let currentLanguage = 'de';
    let occupiedParkingSpots = 170;
    let currentParkingSpots = 0;
    let mensaBalance = 12.00;
    let displayedMensaBalance = 12.00;
    let currentGPA = 2.1;
    let isPrivacyModeEnabled = false;
    let isRealModeEnabled = false;
    let currentStudyGroup = 'MT-MP4';

    // --- Globale Variable für den echten Stundenplan ---
    window.allScheduleEvents = [];
    let widgetSelectedDay = -1; // -1 = auto/upcoming, 0-4 = Mon-Fri
    let scheduleWeekOffset = 0;
    let widgetSelectedWeekOffset = 0;

    let currentScheduleDay = new Date().getDay() - 1; // 0 = Montag
    if (currentScheduleDay < 0 || currentScheduleDay > 4) currentScheduleDay = 0; // Am Wochenende auf Montag setzen

    let mensaWeekOffset = 0;
    let currentMensaDay = new Date().getDay() - 1;
    if (currentMensaDay < 0 || currentMensaDay > 4) currentMensaDay = 0;
    let mensaDataCache = {};

    let favoriteEvents = new Set();
    let isFavoritesFilterActive = false;

    function changeScheduleWeek(dir) {
        scheduleWeekOffset += dir;
        updateScheduleWeekLabel();

        let newDay = dir > 0 ? 0 : 4; // 0 = Montag, 4 = Freitag
        const dayBtns = document.querySelectorAll('#schedule-day-segments .segment-btn');
        if (dayBtns[newDay]) {
            switchScheduleDay(newDay, dayBtns[newDay]);
        } else {
            currentScheduleDay = newDay;
            updateScheduleModalView();
        }
    }

    function updateScheduleWeekLabel() {
        const label = document.getElementById('schedule-week-label');
        if (!label) return;
        if (scheduleWeekOffset === 0) {
            label.innerText = translations[currentLanguage].schedule_week_this;
        } else if (scheduleWeekOffset === 1) {
            label.innerText = translations[currentLanguage].schedule_week_next;
        } else if (scheduleWeekOffset === -1) {
            label.innerText = translations[currentLanguage].schedule_week_last;
        } else if (scheduleWeekOffset > 1) {
            label.innerText = translations[currentLanguage].schedule_week_in.replace('{n}', scheduleWeekOffset);
        } else {
            label.innerText = translations[currentLanguage].schedule_week_ago.replace('{n}', Math.abs(scheduleWeekOffset));
        }
    }

    function getFullMajorName(group) {
        if (!group) return "Unbekannt";

        // Extrahiert schlau nur die Buchstaben am Anfang (ignoriert Zahlen, Leerzeichen oder Bindestriche)
        const match = group.trim().match(/^[a-zA-ZäöüÄÖÜß]+/);
        if (!match) return group;

        const prefix = match[0].toUpperCase();
        const map = {
            'MT': 'Medientechnik',
            'AI': 'Angewandte Informatik',
            'WI': 'Wirtschaftsinformatik',
            'BI': 'Bauingenieurwesen',
            'UI': 'Umweltingenieurwesen',
            'AW': 'Angewandte Wirtschaftswissenschaften',
            'BW': 'Betriebswirtschaft',
            'TM': 'Tourismusmanagement',
            'WIN': 'Wirtschaftsingenieurwesen',
            'MB': 'Maschinenbau',
            'ME': 'Mechatronik',
            'ET': 'Elektrotechnik',
            'PT': 'Physiotherapie',
            'PM': 'Pflegemanagement'
        };
        return map[prefix] ? map[prefix] : group;
    }

    function openScheduleSettingsModal(caller = null) {
        const gear = document.getElementById('schedule-settings-gear-icon');
        if (gear) {
            gear.classList.add('rotate-gear-anim');
            setTimeout(() => gear.classList.remove('rotate-gear-anim'), 400);
        }
        const iframeGear = document.getElementById('iframe-settings-gear-icon');
        if (iframeGear && iframeGear.style.display !== 'none') {
            iframeGear.classList.add('rotate-gear-anim');
            setTimeout(() => iframeGear.classList.remove('rotate-gear-anim'), 400);
        }

        const iframeModal = document.getElementById('iframe-modal');
        if (caller) {
            window.scheduleSettingsCaller = caller;
        } else if (iframeModal && iframeModal.classList.contains('show')) {
            window.scheduleSettingsCaller = 'iframe';
        } else {
            window.scheduleSettingsCaller = 'schedule';
        }

        if (caller === 'profile') {
            // Keine vorherigen Fenster zu schließen, keine Zahnrad-Wartezeit nötig
            const inputEl = document.getElementById('schedule-group-input');
            if (inputEl) inputEl.value = currentStudyGroup;

            document.getElementById('modal-overlay').classList.add('show');
            setTimeout(() => {
                document.getElementById('schedule-settings-modal').classList.add('show');
                if (inputEl) inputEl.focus();
            }, 10);
        } else {
            // Lasse die Zahnrad-Animation kurz laufen (250ms), bevor das aktuelle Fenster schließt
            setTimeout(() => {
                closeModal();
                setTimeout(() => {
                    const inputEl = document.getElementById('schedule-group-input');
                    if (inputEl) inputEl.value = currentStudyGroup;

                    document.getElementById('modal-overlay').classList.add('show');
                    document.getElementById('schedule-settings-modal').classList.add('show');
                    if (inputEl) inputEl.focus();
                }, 300);
            }, 250);
        }
    }

    function saveStudyGroup() {
        const inputEl = document.getElementById('schedule-group-input');
        if (!inputEl) return;
        const newGroup = inputEl.value.trim().toUpperCase(); // Großschreibung für Standard-Kürzel erzwingen

        if (newGroup !== '') {
            if (currentStudyGroup !== newGroup) {
                currentStudyGroup = newGroup;
                if (isStorageEnabled()) saveAllData();

                if (isRealModeEnabled) {
                    localStorage.removeItem('thd_schedule_cache');
                    loadSchedule();
                }
            }

            // Den Studiengang dynamisch im Profiltext anpassen
            const majorEl = document.querySelector('[data-translate="profile_major"]');
            if (majorEl) {
                const displayName = getFullMajorName(currentStudyGroup);
                majorEl.innerText = displayName;
                ['de', 'en', 'fi'].forEach(lang => {
                    if (translations[lang]) translations[lang].profile_major = displayName;
                });
            }
        }

        closeModal();
        setTimeout(() => {
            if (window.scheduleSettingsCaller === 'iframe') {
                openIframeModal('https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent('https://thabella.th-deg.de/thabella/opn/pdf/page/' + currentStudyGroup), 'Stundenplan (' + currentStudyGroup + ')', true);
            } else if (window.scheduleSettingsCaller === 'schedule') {
                openScheduleModal();
            }
        }, 300);
    }

    function cancelScheduleSettings() {
        closeModal();
        setTimeout(() => {
            if (window.scheduleSettingsCaller === 'iframe') {
                openIframeModal('https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent('https://thabella.th-deg.de/thabella/opn/pdf/page/' + currentStudyGroup), 'Stundenplan (' + currentStudyGroup + ')', true);
            } else if (window.scheduleSettingsCaller === 'schedule') {
                openScheduleModal();
            }
        }, 300);
    }

    function openScheduleModal() {
        // Prüfen, ob das Widget gerade einen spezifischen Tag anzeigt
        if (widgetSelectedDay !== -1) {
            scheduleWeekOffset = widgetSelectedWeekOffset;
            currentScheduleDay = widgetSelectedDay;
        } else {
            scheduleWeekOffset = 0;
            let day = new Date().getDay() - 1;
            currentScheduleDay = day < 0 || day > 4 ? 0 : day;
        }

        updateScheduleWeekLabel();
        document.getElementById('modal-overlay').classList.add('show');
        setTimeout(() => {
            document.getElementById('schedule-modal').classList.add('show');
            const dayBtns = document.querySelectorAll('#schedule-day-segments .segment-btn');
            if (dayBtns[currentScheduleDay]) {
                switchScheduleDay(currentScheduleDay, dayBtns[currentScheduleDay]);
            } else {
                updateScheduleModalView();
            }
        }, 10);
    }

    function switchScheduleDay(dayIndex, btn) {
        const control = document.getElementById('schedule-day-segments');
        const buttons = control.querySelectorAll('.segment-btn');
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const highlight = document.getElementById('schedule-day-highlight');
        highlight.style.transform = `translateX(${dayIndex * 100}%)`;

        currentScheduleDay = dayIndex;
        updateScheduleModalView();
    }

    function updateScheduleModalView() {
        const list = document.getElementById('schedule-modal-list');
        const viewport = document.getElementById('schedule-viewport');
        list.innerHTML = '';

        if (!isRealModeEnabled) {
            const demoSchedule = [
                [ // Monday
                    { title: 'Webentwicklung', time: '08:00 - 09:30', room: 'G201', tasks: 'Projekt 2' },
                    { title: 'Medienrecht', time: '09:45 - 11:15', room: 'F102', tasks: 'Fallstudie 4' },
                    { title: 'Mathematik', time: '11:15 - 12:45', room: 'E105', tasks: 'Übung 3' },
                    { title: 'Design', time: '12:45 - 14:15', room: 'J001', tasks: 'Skizzenbuch' },
                    { title: 'Informatik', time: '14:30 - 16:00', room: 'B202', tasks: 'Abgabe 1' },
                    { title: 'Physik', time: '16:15 - 17:45', room: 'D101', tasks: 'Laborbericht' }
                ],
                [ // Tuesday
                    { title: 'Computergrafik', time: '09:45 - 11:15', room: 'B202', tasks: 'Raytracer' },
                    { title: 'Projektmanagement', time: '11:15 - 12:45', room: 'C112', tasks: 'Meilenstein 3' },
                    { title: 'Audio- & Videotechnik', time: '14:30 - 16:00', room: 'J004', tasks: 'Kurzfilm' }
                ],
                [ // Wednesday
                    { title: 'Datenbanksysteme', time: '08:00 - 09:30', room: 'G201', tasks: 'SQL Abfragen' },
                    { title: 'Englisch B2', time: '09:45 - 11:15', room: 'A203', tasks: 'Presentation' },
                    { title: 'Programmieren 1', time: '14:30 - 16:00', room: 'B202', tasks: 'Übungsblatt 5' }
                ],
                [ // Thursday
                    { title: 'Mediengestaltung', time: '11:15 - 12:45', room: 'J001', tasks: 'Plakatentwurf' },
                    { title: 'Algorithmen & Datenstrukturen', time: '14:30 - 16:00', room: 'B202', tasks: 'Sortieralgorithmen' }
                ],
                [ // Friday
                    { title: 'Tutorium Programmieren', time: '09:45 - 11:15', room: 'G103', tasks: 'Fragen klären' }
                ]
            ];

            const courses = demoSchedule[currentScheduleDay] || [];

            if (courses.length === 0) {
                list.innerHTML = `<div data-translate="schedule_no_lectures_day" style="text-align: center; color: var(--text-sub); padding: 30px 10px;">${translations[currentLanguage].schedule_no_lectures_day}</div>`;
            } else {
                courses.forEach(course => {
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.style.cssText = 'cursor: pointer; background-color: var(--item-bg); margin: 0; flex-direction: column; align-items: flex-start; gap: 4px; position: relative; isolation: isolate;';

                    item.innerHTML = `
                        <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; gap: 8px;">
                    <span style="font-weight: 600; color: var(--text-main); font-size: 14px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${course.title}</span>
                            <span style="color: var(--accent-blue); font-size: 12px; font-weight: 600; white-space: nowrap;">${course.room || '?'}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-sub);">${course.time}</div>
                    `;

                    item.onclick = () => {
                        closeModal();
                        setTimeout(() => {
                            openModal(course.title, course.time, course.room || '?', course.tasks || 'Keine', course.title);
                        }, 300);
                    };

                    list.appendChild(item);
                });
            }

            list.style.height = 'auto';
            const newHeight = list.scrollHeight;
            list.style.height = '100%';
            const maxHeight = window.innerHeight * 0.45;
            viewport.style.height = (newHeight > maxHeight ? maxHeight : newHeight) + 'px';
            list.style.overflowY = newHeight > maxHeight ? 'auto' : 'hidden';
            return;
        }

        const now = new Date();
        const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfCurrentWeek = new Date(now);
        startOfCurrentWeek.setDate(now.getDate() - currentDayOfWeek);
        startOfCurrentWeek.setHours(0,0,0,0);

        const startOfTargetWeek = new Date(startOfCurrentWeek);
        startOfTargetWeek.setDate(startOfCurrentWeek.getDate() + (scheduleWeekOffset * 7));

        const endOfTargetWeek = new Date(startOfTargetWeek);
        endOfTargetWeek.setDate(startOfTargetWeek.getDate() + 6);
        endOfTargetWeek.setHours(23,59,59,999);

        const courses = (window.allScheduleEvents || []).filter(c => {
            return c.dateObj >= startOfTargetWeek && c.dateObj <= endOfTargetWeek && c.day === currentScheduleDay;
        });
        courses.sort((a, b) => a.dateObj - b.dateObj);

        if (courses.length === 0) {
            list.innerHTML = `<div data-translate="schedule_no_lectures_day" style="text-align: center; color: var(--text-sub); padding: 30px 10px;">${translations[currentLanguage].schedule_no_lectures_day}</div>`;
        } else {
            courses.forEach(course => {
                const item = document.createElement('div');
                item.className = 'list-item';
                item.style.cssText = 'cursor: pointer; background-color: var(--item-bg); margin: 0; flex-direction: column; align-items: flex-start; gap: 4px; position: relative; isolation: isolate;';

                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-start; gap: 8px;">
                        <span style="font-weight: 600; color: var(--text-main); font-size: 14px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${course.title}</span>
                        <span style="color: var(--accent-blue); font-size: 12px; font-weight: 600; white-space: nowrap;">${course.room || '?'}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--text-sub);">${course.start} - ${course.end}</div>
                `;

                item.onclick = () => {
                    closeModal();
                    setTimeout(() => {
                        openModal(course.title, `${course.start} - ${course.end}`, course.room || '?', 'Keine', course.title);
                    }, 300);
                };

                list.appendChild(item);
            });
        }

        // Sanfte Höhen-Animation
        list.style.height = 'auto';
        const newHeight = list.scrollHeight;
        list.style.height = '100%';
        const maxHeight = window.innerHeight * 0.45; // 45vh

        if (newHeight > maxHeight) {
            viewport.style.height = maxHeight + 'px';
            list.style.overflowY = 'auto';
        } else {
            viewport.style.height = newHeight + 'px';
            list.style.overflowY = 'hidden';
        }
    }

    function selectDayForWidget() {
        widgetSelectedDay = currentScheduleDay;
        widgetSelectedWeekOffset = scheduleWeekOffset;
        updateScheduleWidget(false);
        closeModal();
    }

    function jumpToNextLectureDay() {
        if (!window.allScheduleEvents || window.allScheduleEvents.length === 0) return;

        const now = new Date();
        let currentViewEnd = new Date(now);
        currentViewEnd.setHours(23, 59, 59, 999);

        if (widgetSelectedDay !== -1) {
            const todayDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
            let dayOffset = (widgetSelectedDay - todayDayIndex) + (widgetSelectedWeekOffset * 7);
            currentViewEnd = new Date(now);
            currentViewEnd.setDate(now.getDate() + dayOffset);
            currentViewEnd.setHours(23, 59, 59, 999);
        }

        const sortedEvents = [...window.allScheduleEvents].sort((a, b) => a.dateObj - b.dateObj);
        const nextEvent = sortedEvents.find(e => e.dateObj > currentViewEnd);

        if (nextEvent) {
            const nextEventDate = nextEvent.dateObj;

            const todayDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
            const currentMonday = new Date(now);
            currentMonday.setDate(now.getDate() - todayDay);
            currentMonday.setHours(0,0,0,0);

            const nextEventDay = nextEventDate.getDay() === 0 ? 6 : nextEventDate.getDay() - 1;
            const nextEventMonday = new Date(nextEventDate);
            nextEventMonday.setDate(nextEventDate.getDate() - nextEventDay);
            nextEventMonday.setHours(0,0,0,0);

            const diffTime = nextEventMonday - currentMonday;
            const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

            widgetSelectedDay = nextEventDay > 4 ? 0 : nextEventDay;
            widgetSelectedWeekOffset = diffWeeks;

            scheduleWeekOffset = diffWeeks;
            currentScheduleDay = widgetSelectedDay;

            updateScheduleWidget(true);
        }
    }

    function updateScheduleWidget(isInitialLoad = false) {
        if (!isRealModeEnabled) return;
        const scheduleBox = document.getElementById('widget-schedule');
        if (!scheduleBox || !window.allScheduleEvents) return;

        scheduleBox.innerHTML = '';
        const now = new Date();
        const events = window.allScheduleEvents;
        let eventsToShow = [];

        if (widgetSelectedDay === -1) {
            // Auto-Modus: Zeige nur noch anstehende Termine für HEUTE
            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);
            eventsToShow = events.filter(e => e.endDateObj && e.endDateObj > now && e.dateObj <= endOfToday)
                                 .sort((a, b) => a.dateObj - b.dateObj);
        } else {
            // Modus für ausgewählten Tag
            const todayDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;

            // Exakt die Woche und den Tag anzeigen, die der Nutzer im Modal ausgewählt hat
            let dayOffset = (widgetSelectedDay - todayDayIndex) + (widgetSelectedWeekOffset * 7);

            const targetDate = new Date();
            targetDate.setDate(now.getDate() + dayOffset);
            targetDate.setHours(0, 0, 0, 0);

            const endOfTargetDate = new Date(targetDate);
            endOfTargetDate.setHours(23, 59, 59, 999);

            eventsToShow = events.filter(e => e.dateObj >= targetDate && e.dateObj <= endOfTargetDate)
                                 .sort((a, b) => a.dateObj - b.dateObj);
        }

        if (eventsToShow.length === 0) {


            let currentViewEnd = new Date(now);
            currentViewEnd.setHours(23, 59, 59, 999);
            if (widgetSelectedDay !== -1) {
                const todayDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                let dayOffset = (widgetSelectedDay - todayDayIndex) + (widgetSelectedWeekOffset * 7);
                currentViewEnd = new Date(now);
                currentViewEnd.setDate(now.getDate() + dayOffset);
                currentViewEnd.setHours(23, 59, 59, 999);
            }

            const sortedEvents = [...events].sort((a, b) => a.dateObj - b.dateObj);
            const nextEvent = sortedEvents.find(e => e.dateObj > currentViewEnd);

            let emptyHtml = '';
            // Den Hinweis "Tippe für den Plan" nur anzeigen, wenn es keinen Button für den nächsten Tag gibt
            const subTextHtml = nextEvent ? '' : `<div data-translate="schedule_tap_for_plan" class="schedule-time" style="color: var(--accent-blue); margin-top: 4px;">${translations[currentLanguage].schedule_tap_for_plan}</div>`;

            if (widgetSelectedDay !== -1) {
                const daysDe = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
                const daysEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const daysFi = ['Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai'];

                ['de', 'en', 'fi'].forEach(lang => {
                    let dName = daysDe[widgetSelectedDay];
                    if (lang === 'en') dName = daysEn[widgetSelectedDay];
                    else if (lang === 'fi') dName = daysFi[widgetSelectedDay];
                    translations[lang].schedule_no_lectures_on_dyn = translations[lang].schedule_no_lectures_on.replace('{day}', dName);
                });
                const titleText = translations[currentLanguage].schedule_no_lectures_on_dyn;
                emptyHtml = `<div class="schedule-item"><div data-translate="schedule_no_lectures_on_dyn" class="schedule-title">${titleText}</div>${subTextHtml}</div>`;
            } else {
                const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
                const endOfToday = new Date(); endOfToday.setHours(23,59,59,999);
                const todayEvents = events.filter(e => e.dateObj >= startOfToday && e.dateObj <= endOfToday);

                if (todayEvents.length > 0) {
                    const titleText = translations[currentLanguage].schedule_done_today;
                    const descText = translations[currentLanguage].schedule_done_desc;
                    emptyHtml = `<div class="schedule-item"><div data-translate="schedule_done_today" class="schedule-title">${titleText}</div><div data-translate="schedule_done_desc" class="schedule-time">${descText}</div>${subTextHtml}</div>`;
                } else {
                    const titleText = translations[currentLanguage].schedule_no_lectures;
                    emptyHtml = `<div class="schedule-item"><div data-translate="schedule_no_lectures" class="schedule-title">${titleText}</div>${subTextHtml}</div>`;
                }
            }

            if (nextEvent) {
                const daysDeShort = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                const daysEnShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const daysFiShort = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su'];
                const nextDayIndex = nextEvent.dateObj.getDay() === 0 ? 6 : nextEvent.dateObj.getDay() - 1;
                const nextDateStr = String(nextEvent.dateObj.getDate()).padStart(2, '0') + '.' + String(nextEvent.dateObj.getMonth() + 1).padStart(2, '0') + '.';

                ['de', 'en', 'fi'].forEach(lang => {
                    let nDayStr = daysDeShort[nextDayIndex];
                    if (lang === 'en') nDayStr = daysEnShort[nextDayIndex];
                    else if (lang === 'fi') nDayStr = daysFiShort[nextDayIndex];
                    translations[lang].schedule_next_day_dyn = translations[lang].schedule_next_day.replace('{day}', nDayStr).replace('{date}', nextDateStr);
                });
                const btnText = translations[currentLanguage].schedule_next_day_dyn;

                emptyHtml += `
                <div class="schedule-item" onclick="event.stopPropagation(); this.style.transform='scale(0.95)'; setTimeout(() => jumpToNextLectureDay(), 250)" style="background-color: rgba(58, 130, 247, 0.15); border: 1.5px solid rgba(58, 130, 247, 0.3); box-sizing: border-box; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease;">
                    <div class="schedule-title" style="color: var(--accent-blue); display: flex; align-items: center; gap: 6px;">
                        <span data-translate="schedule_next_day_dyn">${btnText}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                </div>`;
            }

            scheduleBox.innerHTML = emptyHtml;
            return;
        }

        eventsToShow.slice(0, 15).forEach(ev => {
            const item = document.createElement('div');
            item.className = 'schedule-item';
            item.style.position = 'relative';
            item.style.isolation = 'isolate';

            let dayPrefix = '';
            if (ev.dateObj.toDateString() !== now.toDateString()) {
                const daysDe = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
                const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = currentLanguage === 'de' ? daysDe[ev.dateObj.getDay()] : daysEn[ev.dateObj.getDay()];
                dayPrefix = `<span style="color: var(--accent-orange); font-weight: 700; margin-right: 6px;">${dayName}:</span>`;
            }

            item.innerHTML = `
                <div class="schedule-progress-fill" style="width: 0%;"></div>
                <div class="schedule-title" style="display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${dayPrefix}
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ev.title}</span>
                </div>
                <div class="schedule-time">${ev.start} - ${ev.end} | Raum: ${ev.room || '?' }</div>
            `;
            scheduleBox.appendChild(item);
        });

        updateScheduleProgress(isInitialLoad, isInitialLoad);
    }

    function updateMensaBalance(animate = true) {
      const balanceEl = document.getElementById('mensa-balance-amount');
      if (!balanceEl) return;

      if (!animate) {
        displayedMensaBalance = mensaBalance;
        balanceEl.innerText = mensaBalance.toFixed(2).replace('.', ',') + '€';
        return;
      }

      const startValue = displayedMensaBalance;
      const endValue = mensaBalance;
      const duration = 1200; // 1.2 Sekunden für die Roll-Animation
      const startTime = performance.now();

      function animateBalance(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4); // easeOutQuart

        displayedMensaBalance = startValue + (endValue - startValue) * easeOut;
        balanceEl.innerText = displayedMensaBalance.toFixed(2).replace('.', ',') + '€';

        if (progress < 1) {
          requestAnimationFrame(animateBalance);
        } else {
          displayedMensaBalance = mensaBalance;
          balanceEl.innerText = mensaBalance.toFixed(2).replace('.', ',') + '€';
        }
      }

      requestAnimationFrame(animateBalance);
    }

    function calculateGPAFromList() {
      const gradeElements = document.querySelectorAll('.grades-list .grade-value');
      let total = 0;
      let count = 0;

      gradeElements.forEach(el => {
        const val = parseFloat(el.innerText.replace(',', '.'));
        if (!isNaN(val) && val > 0) {
          total += val;
          count++;
        }
      });

      if (count > 0) {
        currentGPA = total / count;
      } else {
        currentGPA = 0.0;
      }

      const gpaStr = currentGPA.toFixed(1).replace('.', ',');

      const gpaEl = document.getElementById('profile-gpa-value');
      if (gpaEl) gpaEl.innerText = gpaStr;
      const homeGpaEl = document.getElementById('home-gpa-number');
      if (homeGpaEl) homeGpaEl.innerText = gpaStr;
    }

    function executeTopup() {
      mensaBalance += selectedTopupAmount;
      updateMensaBalance();
      closeModal();
      if (isStorageEnabled()) saveAllData();
    }

    function improveGPA() {
      if (mensaBalance < 50.00) {
        closeModal();
        setTimeout(openInsufficientFundsModal, 300);
        return;
      }

      const gradeElements = Array.from(document.querySelectorAll('.grades-list .grade-value'));
      if (gradeElements.length === 0) return;

      let worstEl = null;
      let worstVal = 0;
      gradeElements.forEach(el => {
        const val = parseFloat(el.innerText.replace(',', '.'));
        if (!isNaN(val) && val > worstVal) {
            worstVal = val;
            worstEl = el;
        }
      });

      if (!worstEl || worstVal <= 1.0) {
        alert(currentLanguage === 'de' ? "Besser geht's nicht!" : "Can't get any better!");
        return;
      }

      mensaBalance -= 50.00;
      updateMensaBalance();

      // Die schlechteste Note in die nächstbessere offizielle Note verbessern
      const w = Math.round(worstVal * 10);
      let newVal;
      if (w > 40) newVal = 4.0;
      else if (w > 37) newVal = 3.7;
      else if (w > 33) newVal = 3.3;
      else if (w > 30) newVal = 3.0;
      else if (w > 27) newVal = 2.7;
      else if (w > 23) newVal = 2.3;
      else if (w > 20) newVal = 2.0;
      else if (w > 17) newVal = 1.7;
      else if (w > 13) newVal = 1.3;
      else newVal = 1.0;

      worstEl.innerText = newVal.toFixed(1).replace('.', ',');

      calculateGPAFromList(); // Durchschnitt anhand der neuen Note neu berechnen

      closeModal();
      if (isStorageEnabled()) saveAllData();
    }

    function updateParkingDisplay(animate = true) {
      const bar = document.getElementById('parking-bar');
      const statusText = document.querySelector('.parking-status');
      if (!bar) return;

      if (!animate) {
        currentParkingSpots = occupiedParkingSpots;
        applyParkingVisuals(currentParkingSpots, bar, statusText);
        return;
      }

      const startValue = currentParkingSpots;
      const endValue = occupiedParkingSpots;
      const duration = 1200; // 1.2s analog zur bisherigen CSS-Animation
      const startTime = performance.now();

      function animateBar(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4); // Sanftes Abbremsen

        currentParkingSpots = startValue + (endValue - startValue) * easeOut;
        applyParkingVisuals(currentParkingSpots, bar, statusText);

        if (progress < 1) {
          requestAnimationFrame(animateBar);
        } else {
          currentParkingSpots = occupiedParkingSpots;
          applyParkingVisuals(currentParkingSpots, bar, statusText);
        }
      }

      requestAnimationFrame(animateBar);
    }

    function applyParkingVisuals(spots, bar, statusText) {
      const percentage = (spots / 200) * 100;
      bar.style.width = percentage + '%';

      const el = document.querySelector('[data-translate="parking_text"]');
      if (el) {
        el.innerText = translations[currentLanguage].parking_text.replace('{spots}', Math.round(spots));
      }

      let r, g, b;
      if (percentage <= 50) {
          const p = percentage / 50;
          r = Math.round(52 + (255 - 52) * p); // Fließend von Grün zu Orange
          g = Math.round(199 + (149 - 199) * p);
          b = Math.round(89 + (0 - 89) * p);
      } else {
          const p = Math.min((percentage - 50) / 35, 1); // Fließend von Orange zu Rot
          r = 255;
          g = Math.round(149 + (59 - 149) * p);
          b = Math.round(0 + (48 - 0) * p);
      }

      const color = `rgb(${r}, ${g}, ${b})`;
      bar.style.backgroundColor = color;

      if (statusText) {
          statusText.style.color = color;
          statusText.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.15)`;

          if (percentage >= 85) {
              statusText.innerText = translations[currentLanguage].parking_status_full;
          } else if (percentage >= 50) {
              statusText.innerText = translations[currentLanguage].parking_status_medium;
          } else {
              statusText.innerText = translations[currentLanguage].parking_status_low;
          }
      }
    }

    function initParkingChartInteraction() {
      const chartContainer = document.getElementById('parking-chart-container');
      if (!chartContainer) return;

      const tooltip = document.createElement('div');
      tooltip.className = 'chart-tooltip';
      tooltip.id = 'chart-tooltip';
      chartContainer.appendChild(tooltip);

      let isInteracting = false;

      const handleInteraction = (e) => {
        if (e.cancelable) e.preventDefault(); // Verhindert Scrollen beim Wischen über das Diagramm

        isInteracting = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

        const wrappers = chartContainer.querySelectorAll('.chart-bar-wrapper');
        let closestWrapper = null;
        let minDistance = Infinity;

        // Findet den Balken, der am nächsten am Finger liegt
        wrappers.forEach(wrapper => {
          const rect = wrapper.getBoundingClientRect();
          const center = rect.left + rect.width / 2;
          const distance = Math.abs(clientX - center);
          if (distance < minDistance) {
            minDistance = distance;
            closestWrapper = wrapper;
          }
        });

        if (closestWrapper && minDistance < 40) {
          wrappers.forEach(w => w.classList.remove('active'));
          closestWrapper.classList.add('active');
          chartContainer.classList.add('has-active');

          const bar = closestWrapper.querySelector('.chart-bar');
          const heightPercent = parseInt(bar.style.height);
          const cars = Math.round((heightPercent / 100) * 200); // 200 ist die maximale Auslastung

          tooltip.innerText = translations[currentLanguage].chart_cars_tooltip.replace('{n}', cars);

          const wRect = closestWrapper.getBoundingClientRect();
          const cRect = chartContainer.getBoundingClientRect();

          const leftPos = (wRect.left - cRect.left) + (wRect.width / 2);
          const topPos = cRect.height - 25 - ((heightPercent / 100) * (cRect.height - 25)) - 8;

          tooltip.style.left = leftPos + 'px';
          tooltip.style.top = topPos + 'px';
          tooltip.style.opacity = '1';
        }
      };

      const stopInteraction = () => {
        isInteracting = false;
        chartContainer.classList.remove('has-active');
        chartContainer.querySelectorAll('.chart-bar-wrapper').forEach(w => w.classList.remove('active'));
        tooltip.style.opacity = '0';
      };

      chartContainer.addEventListener('touchstart', handleInteraction, { passive: false });
      chartContainer.addEventListener('touchmove', handleInteraction, { passive: false });
      chartContainer.addEventListener('touchend', stopInteraction);
      chartContainer.addEventListener('touchcancel', stopInteraction);

      chartContainer.addEventListener('mousedown', (e) => { if (e.button === 0) handleInteraction(e); });
      chartContainer.addEventListener('mousemove', (e) => { if (isInteracting) handleInteraction(e); });
      document.addEventListener('mouseup', () => { if (isInteracting) stopInteraction(); });
    }

    function initGradeChartInteraction() {
      const chartContainer = document.getElementById('grade-chart-container');
      if (!chartContainer) return;

      let isInteracting = false;

      const handleInteraction = (e) => {
        if (e.cancelable) e.preventDefault(); // Verhindert Scrollen beim Wischen über das Diagramm

        isInteracting = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

        const wrappers = chartContainer.querySelectorAll('.chart-bar-wrapper');
        let closestWrapper = null;
        let minDistance = Infinity;

        wrappers.forEach(wrapper => {
          const rect = wrapper.getBoundingClientRect();
          const center = rect.left + rect.width / 2;
          const distance = Math.abs(clientX - center);
          if (distance < minDistance) {
            minDistance = distance;
            closestWrapper = wrapper;
          }
        });

        const tooltip = document.getElementById('grade-chart-tooltip');
        if (closestWrapper && minDistance < 40 && tooltip) {
          wrappers.forEach(w => w.classList.remove('active'));
          closestWrapper.classList.add('active');
          chartContainer.classList.add('has-active');

          const bar = closestWrapper.querySelector('.chart-bar');
          const heightPercent = parseInt(bar.style.height);
          const count = closestWrapper.dataset.value;

          tooltip.innerText = translations[currentLanguage].chart_grades_tooltip.replace('{n}', count);

          const wRect = closestWrapper.getBoundingClientRect();
          const cRect = chartContainer.getBoundingClientRect();

          const leftPos = (wRect.left - cRect.left) + (wRect.width / 2);
          const topPos = cRect.height - 25 - ((heightPercent / 100) * (cRect.height - 25)) - 8;

          tooltip.style.left = leftPos + 'px';
          tooltip.style.top = topPos + 'px';
          tooltip.style.opacity = '1';
        }
      };

      const stopInteraction = () => {
        isInteracting = false;

        chartContainer.querySelectorAll('.chart-bar-wrapper').forEach(w => {
          w.classList.remove('active');
          if (w.dataset.isUserGrade === 'true') {
              w.classList.add('active');
          }
        });
        chartContainer.classList.add('has-active');

        const tooltip = document.getElementById('grade-chart-tooltip');
        if (tooltip) tooltip.style.opacity = '0';
      };

      chartContainer.addEventListener('touchstart', handleInteraction, { passive: false });
      chartContainer.addEventListener('touchmove', handleInteraction, { passive: false });
      chartContainer.addEventListener('touchend', stopInteraction);
      chartContainer.addEventListener('touchcancel', stopInteraction);

      chartContainer.addEventListener('mousedown', (e) => { if (e.button === 0) handleInteraction(e); });
      chartContainer.addEventListener('mousemove', (e) => { if (isInteracting) handleInteraction(e); });
      document.addEventListener('mouseup', () => { if (isInteracting) stopInteraction(); });
    }

    function scrambleText(el, newText, isPlaceholder) {
      // Verwende Zeichen mit ähnlicher Breite, um horizontales "Wackeln" des Textes zu minimieren
      const chars = 'aceghkmnopqrsuvxyz023456789#*';
      let iteration = 0;
      clearInterval(el.scrambleInterval);

      const tick = () => {
        let result = '';
        for (let i = 0; i < newText.length; i++) {
          if (i < Math.floor(iteration)) {
            result += newText[i];
          } else if (newText[i] === ' ' || newText[i] === '\n') {
            result += newText[i];
          } else {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }

        if (isPlaceholder) {
          el.placeholder = result;
        } else {
          el.innerText = result;
        }

        if (iteration >= newText.length) {
          clearInterval(el.scrambleInterval);
          if (isPlaceholder) {
            el.placeholder = newText;
          } else {
            el.innerText = newText;
          }
        }

        iteration += Math.max(0.5, newText.length / 15);
      };

      tick(); // Führt den ersten Frame sofort aus, um den Text synchron auszutauschen
      el.scrambleInterval = setInterval(tick, 30);
    }

    function setLanguage(lang) {
      if (currentLanguage === lang) return;
      currentLanguage = lang;

      // Wenn der Nutzer sehr schnell umschaltet, zuerst alte Größen-Sperren aufheben,
      // damit die echten neuen Dimensionen berechnet werden können.
      document.querySelectorAll('[data-orig-width-saved]').forEach(el => {
        el.style.boxSizing = el.getAttribute('data-orig-box-sizing');
        el.style.width = el.getAttribute('data-orig-width');
        el.style.height = el.getAttribute('data-orig-height');
        el.style.overflow = el.getAttribute('data-orig-overflow');
        if (el.hasAttribute('data-orig-display')) el.style.display = el.getAttribute('data-orig-display');
      });

      const activeModal = document.querySelector('.modal.show');
      let startHeight = 0;

      if (activeModal) {
        startHeight = activeModal.offsetHeight;
        activeModal.style.height = startHeight + 'px';
        activeModal.style.overflowY = 'hidden';
      }

      // Einstellungen Modal aktualisieren
      document.querySelectorAll('#language-segments .segment-btn').forEach(b => b.classList.remove('active'));
      const targetBtn1 = document.getElementById('lang-btn-' + lang);
      if (targetBtn1) targetBtn1.classList.add('active');
      const highlight1 = document.getElementById('language-segment-highlight');
      if (highlight1) highlight1.style.transform = `translateX(${lang === 'de' ? 0 : 100}%)`;

      // Setup Modal aktualisieren
      document.querySelectorAll('#setup-language-segments .segment-btn').forEach(b => b.classList.remove('active'));
      const targetBtn2 = document.getElementById('setup-lang-btn-' + lang);
      if (targetBtn2) targetBtn2.classList.add('active');
      const highlight2 = document.getElementById('setup-language-segment-highlight');
      if (highlight2) highlight2.style.transform = `translateX(${lang === 'de' ? 0 : 100}%)`;

      // Widgets VOR der Scramble-Animation aktualisieren, damit sie die neuen data-translate Attribute ins DOM einfügen
      if (isRealModeEnabled) {
          updateScheduleWidget(false);
          loadRealMensaData();
      }
      if (document.getElementById('schedule-modal').classList.contains('show')) {
          updateScheduleModalView();
      }
      if (document.getElementById('mensa-menu-modal').classList.contains('show')) {
          updateMensaModalView();
          updateMensaWeekLabel();
      }

      // 1. Zuerst temporär den finalen Text setzen, um die exakte Zielhöhe zu messen
      document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
          let text = translations[lang][key];
          if (key === 'parking_text') {
            text = text.replace('{spots}', occupiedParkingSpots);
          }

          if (el.hasAttribute('placeholder')) {
            el.placeholder = text;
          } else {
            el.innerText = text;
          }
        }
      });

      if (activeModal) {
        // Neue Zielhöhe messen
        activeModal.style.height = 'auto';
        const targetHeight = activeModal.offsetHeight;

        // Zurücksetzen und flüssig zur neuen Höhe animieren
        activeModal.style.height = startHeight + 'px';
        void activeModal.offsetHeight; // Reflow erzwingen
        activeModal.style.height = targetHeight + 'px';

        clearTimeout(activeModal.languageAnimTimeout);
        activeModal.languageAnimTimeout = setTimeout(() => {
          activeModal.style.height = '';
          activeModal.style.overflowY = '';
        }, 600); // 600ms warten, damit der Scramble-Effekt sicher fertig ist
      }

      // UI-Elemente exakt auf ihrer neuen, finalen Größe einfrieren,
      // damit sich Container (z.B. Buttons) während des Scrambelns nicht verformen.
      const translatedElements = document.querySelectorAll('[data-translate]');
      translatedElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            // Backup der ursprünglichen CSS-Werte (nur beim ersten Setzen)
            if (!el.hasAttribute('data-orig-width-saved')) {
                el.setAttribute('data-orig-box-sizing', el.style.boxSizing || '');
                el.setAttribute('data-orig-width', el.style.width || '');
                el.setAttribute('data-orig-height', el.style.height || '');
                el.setAttribute('data-orig-overflow', el.style.overflow || '');
                el.setAttribute('data-orig-width-saved', 'true');

                const compStyle = window.getComputedStyle(el);
                if (compStyle.display === 'inline') {
                  el.setAttribute('data-orig-display', el.style.display || '');
                  el.style.display = 'inline-block';
                }
            }

            // Element-Abmessungen rigoros einfrieren
            el.style.boxSizing = 'border-box';
            el.style.width = rect.width + 'px';
            el.style.height = rect.height + 'px';
            el.style.overflow = 'hidden';
        }
      });

      // 2. Jetzt die Scramble-Animation starten (überschreibt den Text sofort mit dem ersten Animations-Frame)
      translatedElements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
          let text = translations[lang][key];
          if (key === 'parking_text') {
            text = text.replace('{spots}', occupiedParkingSpots);
          }

          const isPlaceholder = el.hasAttribute('placeholder');
          scrambleText(el, text, isPlaceholder);
        }
      });

      // Nach der Animation die Größen-Sperre wieder aufheben,
      // um die natürliche Reaktionsfähigkeit beim Neigen des Geräts zurückzugeben
      clearTimeout(window.languageLockTimeout);
      window.languageLockTimeout = setTimeout(() => {
        translatedElements.forEach(el => {
          if (el.hasAttribute('data-orig-width-saved')) {
              el.style.boxSizing = el.getAttribute('data-orig-box-sizing');
              el.style.width = el.getAttribute('data-orig-width');
              el.style.height = el.getAttribute('data-orig-height');
              el.style.overflow = el.getAttribute('data-orig-overflow');

              if (el.hasAttribute('data-orig-display')) {
                 el.style.display = el.getAttribute('data-orig-display');
                 el.removeAttribute('data-orig-display');
              }

              // Backup-Werte löschen
              el.removeAttribute('data-orig-box-sizing');
              el.removeAttribute('data-orig-width');
              el.removeAttribute('data-orig-height');
              el.removeAttribute('data-orig-overflow');
              el.removeAttribute('data-orig-width-saved');
          }
        });
      }, 600);

      renderSearchHistory();
      updateRelativeTimes();

      if (isStorageEnabled()) {
          localStorage.setItem('thd_language', lang);
      }
    }

    function openGradeModal(course, grade) {
        // Generiere konsistente Mock-Daten basierend auf dem Kursnamen
        let hash = 0;
        for (let i = 0; i < course.length; i++) {
            hash = course.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);

        const examiners = ['Prof. Dr. Schmidt', 'Prof. Weber', 'Prof. Dr. Meier', 'Prof. Dr. Bauer', 'Prof. Dr. Fuchs', 'Prof. Dr. Wagner', 'Prof. Dr. Müller'];
        const examiner = examiners[hash % examiners.length];

        const days = String((hash % 28) + 1).padStart(2, '0');
        const months = String((hash % 12) + 1).padStart(2, '0');
        const date = `${days}.${months}.2026`;

        const registered = 30 + (hash % 60);
        const participated = registered - (hash % 5);

        const avg = (1.5 + (hash % 15) / 10).toFixed(1).replace('.', ',');

        // Notenverteilung detailliert (1,0 bis 5,0)
        const dist = [
            Math.floor(participated * 0.05) + (hash % 2), // 1,0
            Math.floor(participated * 0.10) + (hash % 3), // 1,3
            Math.floor(participated * 0.15) + (hash % 3), // 1,7
            Math.floor(participated * 0.15) + (hash % 4), // 2,0
            Math.floor(participated * 0.15) + (hash % 3), // 2,3
            Math.floor(participated * 0.10) + (hash % 2), // 2,7
            Math.floor(participated * 0.10) + (hash % 2), // 3,0
            Math.floor(participated * 0.05) + (hash % 2), // 3,3
            Math.floor(participated * 0.05) + (hash % 2), // 3,7
            Math.floor(participated * 0.05) + (hash % 2), // 4,0
            Math.floor(participated * 0.05) + (hash % 2)  // 5,0
        ];

        // Finde heraus, in welche Kategorie die eigene Note fällt
        const gradeNum = parseFloat(String(grade).replace(',', '.'));
        const g = Math.round(gradeNum * 10);
        let userBucket = 0;
        if (g <= 10) userBucket = 0;
        else if (g <= 13) userBucket = 1;
        else if (g <= 17) userBucket = 2;
        else if (g <= 20) userBucket = 3;
        else if (g <= 23) userBucket = 4;
        else if (g <= 27) userBucket = 5;
        else if (g <= 30) userBucket = 6;
        else if (g <= 33) userBucket = 7;
        else if (g <= 37) userBucket = 8;
        else if (g <= 40) userBucket = 9;
        else userBucket = 10;

        document.getElementById('grade-popup-title').innerText = course;
        document.getElementById('grade-popup-grade').innerText = grade;
        document.getElementById('grade-popup-date').innerText = date;
        document.getElementById('grade-popup-examiner').innerText = examiner;
        document.getElementById('grade-popup-participants').innerText = `${registered} / ${participated}`;
        document.getElementById('grade-popup-average').innerText = avg;

        const chartContainer = document.getElementById('grade-chart-container');
        chartContainer.className = 'chart-container has-active';
        chartContainer.innerHTML = `
            <div class="chart-tooltip" id="grade-chart-tooltip"></div>
            <div class="chart-grid-line" style="bottom: 20%;"></div>
            <div class="chart-grid-line" style="bottom: 50%;"></div>
            <div class="chart-grid-line" style="bottom: 80%;"></div>
        `;

        const maxVal = Math.max(...dist, 1);
        const labels = ['1,0', '1,3', '1,7', '2,0', '2,3', '2,7', '3,0', '3,3', '3,7', '4,0', '5,0'];
        const barClasses = ['low', 'low', 'low', 'low', 'low', 'medium', 'medium', 'medium', 'medium', 'medium', 'high'];

        dist.forEach((val, index) => {
            const heightPct = (val / maxVal) * 100;
            const isUserGrade = index === userBucket;

            const wrapper = document.createElement('div');
            wrapper.className = 'chart-bar-wrapper' + (isUserGrade ? ' active' : '');
            wrapper.dataset.value = val;
            wrapper.dataset.isUserGrade = isUserGrade;

            const bar = document.createElement('div');
            bar.className = 'chart-bar ' + barClasses[index];
            bar.style.height = `${heightPct}%`;


            const label = document.createElement('span');
            label.className = 'chart-label';
            label.innerText = labels[index];
            if (isUserGrade) {
                label.style.color = 'var(--text-main)';
                label.style.fontWeight = 'bold';
            }

            wrapper.appendChild(bar);
            wrapper.appendChild(label);
            chartContainer.appendChild(wrapper);
        });

        document.getElementById('modal-overlay').classList.add('show');
        setTimeout(() => {
            document.getElementById('grade-modal').classList.add('show');
        }, 10);
    }

    function openSettingsModal() {
      const gear = document.getElementById('settings-gear-icon');
      if (gear) {
        gear.classList.add('rotate-gear-anim');
        setTimeout(() => gear.classList.remove('rotate-gear-anim'), 400);
      }
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('settings-modal').classList.add('show');
      }, 10);
    }

    function closeSettingsModal() {
      if (currentLanguage === 'en') {
        setLanguage('fi');
      }
      closeModal();
    }

    function refreshWebcam() {
      const timestamp = Date.now();
      const newSrc = `https://th-deg.de/static/images/webcam.jpg?t=${timestamp}`;

      const tempImg = new Image();
      tempImg.onload = () => {
        const thumb = document.getElementById('webcam-img-thumb');
        const full = document.getElementById('webcam-img-full');
        if (thumb) thumb.src = newSrc;
        if (full) full.src = newSrc;
      };
      tempImg.src = newSrc;
    }

    function openWebcamModal() {
      refreshWebcam();
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('webcam-modal').classList.add('show');
      }, 10);
    }

    function openAboutModal() {
      closeModal();
      setTimeout(() => {
        document.getElementById('modal-overlay').classList.add('show');
        document.getElementById('about-modal').classList.add('show');
      }, 300);
    }

    let pressTimer;
    let isLongPress = false;
    let isDraggingSelection = false;
    let dragSelectionAction = 'select'; // Speichert, ob beim Wischen markiert oder abgewählt werden soll

    // Scrollen blockieren und Mails beim Wischen markieren
    document.addEventListener('touchmove', (e) => {
      if (isDraggingSelection) {
        if(e.cancelable) e.preventDefault(); // Stoppt das Scrollen sofort
        const touch = e.touches ? e.touches[0] : e;
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el) {
          const mail = el.closest('.mail-item');
          if (mail) {
            const isSelected = mail.classList.contains('selected');
            // Nur die Aktion ausführen, die der Wisch-Geste entspricht (Markieren ODER Abwählen)
            if ((dragSelectionAction === 'select' && !isSelected) || (dragSelectionAction === 'deselect' && isSelected)) {
              const mailId = mail.getAttribute('data-mail-id');
              if (mailId) {
                  document.querySelectorAll(`.mail-item[data-mail-id="${mailId}"]`).forEach(m => {
                      if (dragSelectionAction === 'select') m.classList.add('selected');
                      else m.classList.remove('selected');
                  });
              } else {
                  if (dragSelectionAction === 'select') mail.classList.add('selected');
                  else mail.classList.remove('selected');
              }
              updateSelectionCount();
            }
          }
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', () => isDraggingSelection = false);
    document.addEventListener('mouseup', () => isDraggingSelection = false);

    function attachMailEventListeners(item) {
        const mailPage = document.getElementById('page-mails');

        // Prüft, ob die swipe-zone fehlt und fügt sie automatisch ein
        let swipeZone = item.querySelector('.swipe-zone');
        if (!swipeZone) {
            swipeZone = document.createElement('div');
            swipeZone.className = 'swipe-zone';
            item.prepend(swipeZone);
        }

        const startDrag = (e) => {
            if (mailPage.classList.contains('selection-mode')) {
                isDraggingSelection = true;

                // Wenn das Element bereits markiert ist, schalten wir für diesen Wischvorgang auf "Abwählen"
                const isSelected = item.classList.contains('selected');
                dragSelectionAction = isSelected ? 'deselect' : 'select';

                const mailId = item.getAttribute('data-mail-id');
                if (mailId) {
                    document.querySelectorAll(`.mail-item[data-mail-id="${mailId}"]`).forEach(el => {
                        if (dragSelectionAction === 'select') el.classList.add('selected');
                        else el.classList.remove('selected');
                    });
                } else {
                    if (dragSelectionAction === 'select') item.classList.add('selected');
                    else item.classList.remove('selected');
                }
                updateSelectionCount();
            }
        };

        swipeZone.addEventListener('mousedown', startDrag);
        swipeZone.addEventListener('touchstart', startDrag, { passive: true });

        const startPress = (e) => {
            if (mailPage.classList.contains('selection-mode')) return;

            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                document.querySelectorAll('.mail-item.selected').forEach(i => i.classList.remove('selected'));
                const mailId = item.getAttribute('data-mail-id');
                if (mailId) {
                    document.querySelectorAll(`.mail-item[data-mail-id="${mailId}"]`).forEach(el => el.classList.add('selected'));
                } else {
                    item.classList.add('selected');
                }
                requestDeleteConfirmation();
            }, 600);
        };

        const cancelPress = () => {
          clearTimeout(pressTimer);
        };

        // Event-Listener für Gedrückthalten (Long-Press)
        item.addEventListener('mousedown', startPress);
        item.addEventListener('touchstart', startPress, { passive: true });
        item.addEventListener('mouseup', cancelPress);
        item.addEventListener('mouseleave', cancelPress);
        item.addEventListener('touchend', cancelPress);
        item.addEventListener('touchmove', cancelPress, { passive: true });

        // Event-Listener für normalen Klick
        item.addEventListener('click', function(e) {
        // Verhindert das Öffnen der Mail nach einem Long-Press
        if (isLongPress) {
          e.preventDefault();
          isLongPress = false;
          return;
        }

        // Logik für den Auswahlmodus
        if (mailPage.classList.contains('selection-mode')) {
          if (isDraggingSelection) return; // Verhindert Abwählen nach dem Wischen

          const mailId = this.getAttribute('data-mail-id');
          const isSelected = this.classList.contains('selected');

          if (mailId) {
              document.querySelectorAll(`.mail-item[data-mail-id="${mailId}"]`).forEach(el => {
                  if (isSelected) el.classList.remove('selected');
                  else el.classList.add('selected');
              });
          } else {
              this.classList.toggle('selected');
          }
          updateSelectionCount();
          return;
        }

        // Markiere E-Mail über alle synchronisierten Ansichten als gelesen
        const mailId = this.getAttribute('data-mail-id');
        if (mailId) {
            document.querySelectorAll(`.mail-item[data-mail-id="${mailId}"]`).forEach(el => el.classList.remove('unread'));
        } else {
            this.classList.remove('unread');
        }
        if (isStorageEnabled()) saveAllData();
        updateUnreadBadge();

        // Lese Daten aus dem geklickten Listeneintrag aus
        const sender = this.querySelector('.mail-sender').innerText;
        const time = this.querySelector('.mail-time').innerText;
        const subject = this.querySelector('.mail-subject').innerText;
        const preview = this.querySelector('.mail-preview').innerText;

        // Setze die Daten im Pop-up
        document.getElementById('email-popup-sender').innerText = sender;
        document.getElementById('email-popup-time').innerText = time;
        document.getElementById('email-popup-subject').innerText = subject;
        document.getElementById('email-popup-body').innerText = preview;

        // Button dynamisch anpassen (Mail vs. iLearn)
        const actionBtn = document.getElementById('email-action-btn');
        const isILearn = this.closest('#ilearn-view') !== null || (this.closest('.mail-column') && Array.from(this.closest('.mail-column').querySelectorAll('.mail-list')).indexOf(this.closest('.mail-list')) === 1);

        if (isILearn) {
          actionBtn.innerText = translations[currentLanguage].course_modal_to_ilearn;
          actionBtn.setAttribute('data-translate', 'course_modal_to_ilearn');
          actionBtn.onclick = () => window.location.href = 'https://ilearn.th-deg.de';
        } else {
          actionBtn.innerText = translations[currentLanguage].email_detail_reply;
          actionBtn.setAttribute('data-translate', 'email_detail_reply');
          actionBtn.onclick = () => replyToMail(sender, subject, preview);
        }

        // Öffne das Modal
        document.getElementById('modal-overlay').classList.add('show');
        setTimeout(() => {
          document.getElementById('email-modal').classList.add('show');
        }, 10);
        });
    }

    // Initiale E-Mails mit Event-Listenern versehen
    const mailItems = document.querySelectorAll('.mail-item');
    mailItems.forEach(item => {
      attachMailEventListeners(item);
    });

    // Initiale Prüfung beim Start der App
    updateUnreadBadge();

    // Suchverlauf initial laden
    renderSearchHistory();

    // Tastatur-Fix für Eingabefelder (verschiebt das jeweilige Fenster nach oben)
    const composeInputs = document.querySelectorAll('.compose-input');
    composeInputs.forEach(input => {
      input.addEventListener('focus', () => {
        const parentModal = input.closest('.modal');
        if(parentModal) parentModal.classList.add('keyboard-up');
      });
      input.addEventListener('blur', () => {
        setTimeout(() => {
          if (!document.activeElement || !document.activeElement.classList.contains('compose-input')) {
            const parentModal = input.closest('.modal');
            if(parentModal) parentModal.classList.remove('keyboard-up');
          }
        }, 250); // Erhöht von 50ms auf 250ms, damit der Button-Klick vor dem Layout-Shift registriert wird
      });
    });

    // ECTS Gedrückthalten (Long-Press) Logik
    function requestEctsDeleteConfirmation() {
      itemToDelete = 'ects'; // Hier geht es um die ECTS Karte
      document.getElementById('delete-confirm-text').innerText = currentLanguage === 'de' ? "Möchtest du deine ECTS wirklich auf 0 zurücksetzen?" : "Do you really want to reset your ECTS to 0?";

      const modalTitle = document.querySelector('#delete-modal .modal-title');
      if (modalTitle) {
          modalTitle.innerText = translations[currentLanguage].delete_ects_title;
          modalTitle.setAttribute('data-translate', 'delete_ects_title');
      }

      openDeleteModal();
    }

    // Hilfsfunktion: Macht jedes Element "gedrückt-haltbar"
    function addLongPress(elementId, action) {
      const el = document.getElementById(elementId);
      if (!el) return;
      let pressTimer;
      const startPress = (e) => {
        pressTimer = setTimeout(() => {
          isLongPress = true;
          action();
        }, 600); // 600ms gedrückt halten
      };
      const cancelPress = () => {
        clearTimeout(pressTimer);
      };

      el.addEventListener('mousedown', startPress);
      el.addEventListener('touchstart', startPress, { passive: true });
      el.addEventListener('mouseup', cancelPress);
      el.addEventListener('mouseleave', cancelPress);
      el.addEventListener('touchend', cancelPress);
      el.addEventListener('touchmove', cancelPress, { passive: true });
    }

    // Long-Press aktivieren
    addLongPress('profile-ects-card', requestEctsDeleteConfirmation);

    // Wischen für Stundenplan-Modal
    const scheduleModal = document.getElementById('schedule-modal');
    let scheduleStartX = 0;
    let scheduleStartY = 0;

    if (scheduleModal) {
      scheduleModal.addEventListener('touchstart', e => {
        if (!e.target.closest('#schedule-modal-list')) return;
        scheduleStartX = e.touches[0].clientX;
        scheduleStartY = e.touches[0].clientY;
      }, { passive: true });

      scheduleModal.addEventListener('touchend', e => {
        if (scheduleStartX === 0 || !e.target.closest('#schedule-modal-list')) {
            scheduleStartX = 0;
            return;
        }

        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;
        let diffX = scheduleStartX - endX;
        let diffY = scheduleStartY - endY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          const dayBtns = document.querySelectorAll('#schedule-day-segments .segment-btn');
          if (diffX > 0 && currentScheduleDay < 4) { // Swipe left
            dayBtns[currentScheduleDay + 1]?.click();
          } else if (diffX < 0 && currentScheduleDay > 0) { // Swipe right
            dayBtns[currentScheduleDay - 1]?.click();
          }
        }
        scheduleStartX = 0;
      });
    }

    // Wischen für Mensa-Modal
    const mensaModal = document.getElementById('mensa-menu-modal');
    let mensaStartX = 0;
    let mensaStartY = 0;

    if (mensaModal) {
      mensaModal.addEventListener('touchstart', e => {
        if (!e.target.closest('#mensa-modal-list')) return;
        mensaStartX = e.touches[0].clientX;
        mensaStartY = e.touches[0].clientY;
      }, { passive: true });

      mensaModal.addEventListener('touchend', e => {
        if (mensaStartX === 0 || !e.target.closest('#mensa-modal-list')) {
            mensaStartX = 0;
            return;
        }

        let endX = e.changedTouches[0].clientX;
        let endY = e.changedTouches[0].clientY;
        let diffX = mensaStartX - endX;
        let diffY = mensaStartY - endY;

        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
          const dayBtns = document.querySelectorAll('#mensa-day-segments .segment-btn');
          if (diffX > 0 && currentMensaDay < 4) { // Swipe left
            dayBtns[currentMensaDay + 1]?.click();
          } else if (diffX < 0 && currentMensaDay > 0) { // Swipe right
            dayBtns[currentMensaDay - 1]?.click();
          }
        }
        mensaStartX = 0;
      });
    }

    // VPN Toggle Logik
    let vpnAnimTimeout;
    function toggleVPN() {
      const vpnToggle = document.getElementById('vpn-toggle');
      const vpnStatusText = document.getElementById('vpn-status-text');
      const vpnCard = document.getElementById('widget-vpn'); // Das Widget-Element holen

      // Vorhandene Animationsklassen entfernen, damit die Animation neu starten kann
      clearTimeout(vpnAnimTimeout);
      vpnCard.classList.remove('vpn-connect-anim', 'vpn-disconnect-anim');
      // Ein "Reflow" wird erzwungen, um sicherzustellen, dass der Browser die Klassenentfernung registriert
      void vpnCard.offsetWidth;

      if (vpnToggle.checked) {
        vpnStatusText.innerText = translations[currentLanguage].vpn_status_connected;
        vpnStatusText.setAttribute('data-translate', 'vpn_status_connected');
        vpnStatusText.classList.add('active');
        vpnCard.classList.add('vpn-connect-anim'); // Grüne Leuchtanimation hinzufügen

        // Klasse nach der Animation entfernen, damit sie beim Tab-Wechsel nicht neu startet
        vpnAnimTimeout = setTimeout(() => {
          vpnCard.classList.remove('vpn-connect-anim');
        }, 700);

        // Benachrichtigung auslösen
        if ("Notification" in window) {
          const title = translations[currentLanguage].vpn_notif_title;
          const options = { body: translations[currentLanguage].vpn_notif_body, icon: 'icon-192.png' };

          const triggerNotification = () => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
              }).catch(() => {
                new Notification(title, options);
              });
            } else {
              new Notification(title, options);
            }
          };

          if (Notification.permission === "granted") {
            triggerNotification();
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                triggerNotification();
              }
            });
          }
        }
      } else {
        vpnStatusText.innerText = translations[currentLanguage].vpn_status_disconnected;
        vpnStatusText.setAttribute('data-translate', 'vpn_status_disconnected');
        vpnStatusText.classList.remove('active');
        vpnCard.classList.add('vpn-disconnect-anim'); // Rote Leuchtanimation hinzufügen

        // Klasse nach der Animation entfernen
        vpnAnimTimeout = setTimeout(() => {
          vpnCard.classList.remove('vpn-disconnect-anim');
        }, 700);
      }

      if (isStorageEnabled()) saveAllData();
    }

    // Service Worker Registrierung für PWA (App-Installation)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
          console.log('ServiceWorker erfolgreich registriert');
        }).catch(err => {
          console.log('ServiceWorker Registrierung fehlgeschlagen: ', err);
        });
      });
    }

    function showDropdownNotification(message, isError = false, onClickCallback = null) {
      const notif = document.createElement('div');
      notif.className = 'dropdown-notification';
      if (isError) notif.classList.add('error');
      notif.innerText = message;

      // Klick-Ereignis hinzufügen, falls definiert
      if (onClickCallback) {
        notif.style.cursor = 'pointer';
        notif.style.pointerEvents = 'auto'; // Überschreibt die CSS-Sperre
        notif.onclick = () => {
          onClickCallback();
          notif.classList.remove('show');
        };
      }

      document.body.appendChild(notif);

      void notif.offsetWidth; // Reflow erzwingen
      notif.classList.add('show');

      setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 400); // Element nach Animation löschen
      }, 3500); // 3.5 Sekunden anzeigen
    }

    let lastMailSentTime = 0;

    function sendMail() {
      const now = Date.now();
      // Prüfen, ob seit der letzten Mail weniger als 10.000 Millisekunden (10 Sek) vergangen sind
      if (now - lastMailSentTime < 10000) {
        const remainingSeconds = Math.ceil((10000 - (now - lastMailSentTime)) / 1000);
        showDropdownNotification(currentLanguage === 'de' ? `Bitte warte noch ${remainingSeconds} Sekunden.` : `Please wait ${remainingSeconds} seconds.`, true);
        return;
      }

      // 1. Text aus den Feldern holen
      const to = document.getElementById('comp-to').value;
      const subject = document.getElementById('comp-subject').value;
      const body = document.getElementById('comp-body').value;
      const mailContext = document.getElementById('comp-body').dataset.context || "";

      if (!to || !subject) return; // Nichts tun, wenn Felder leer sind

      // 2. Das HTML-Element für die Liste bauen
      const newMail = document.createElement('div');
      newMail.className = 'mail-item'; // Ohne "unread", da selbst geschrieben

      newMail.innerHTML = `
        <div class="selection-indicator">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="mail-top">
          <span class="mail-sender">An: ${to}</span>
          <span class="mail-time" data-timestamp="${Date.now()}">${translations[currentLanguage].just_now}</span>
        </div>
        <div class="mail-subject">${subject}</div>
        <div class="mail-preview">${body}</div>
      `;

      // Aktuelle Zeit für die Sperre speichern
      lastMailSentTime = now;

      // 3. Klick-Funktionen aktivieren und oben in die Liste einfügen
      addMailToDOM(newMail, false);

      // 4. Felder leeren und Fenster schließen
      document.getElementById('comp-to').value = '';
      document.getElementById('comp-subject').value = '';
      document.getElementById('comp-body').value = '';
      document.getElementById('comp-body').dataset.context = '';
      updateCharCount(); // Zähler zurücksetzen
      closeModal();

      // KI-Antwort nur anfordern, wenn der echte Modus aktiviert ist
      if (isRealModeEnabled) {
        generateAiReply(to, subject, body, mailContext);
      }
    }

    async function generateAiReply(senderName, originalSubject, originalBody, mailContext = "") {
      const url = 'https://thd-app-backend.onrender.com/api/gemini';

      const userName = document.getElementById('profile-name-display')?.innerText || 'einem Studenten';

      let contextText = "";
      if (mailContext) {
        contextText = `\nDarauf bezieht sich ${userName} (deine vorherige Nachricht):\n"${mailContext}"\n`;
      }

      // System-Prompt für die KI formulieren (kurz und präzise)
      const prompt = `Du antwortest als "${senderName}" auf eine E-Mail von ${userName} (Student der THD).

WICHTIGER SCHREIBSTIL:
- Als Dozent/Einrichtung: professionell, formell (Sie-Form).
- Als Kommilitone: locker (Du-Form), sprich ${userName} mit Namen an. Kurz & menschlich. Keine KI-Phrasen!

${contextText}
E-Mail von ${userName}:
Betreff: ${originalSubject}
Nachricht: ${originalBody}

Antworte NUR mit dem E-Mail-Text. Kein Markdown, keine Platzhalter.`;

      try {
        console.log("Sende E-Mail an die KI...");
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Google/Backend hat die Anfrage abgelehnt:", JSON.stringify(data, null, 2));
          const errorMsg = data.error?.message || JSON.stringify(data);
          let timeHint = "";
          const retryMatch = errorMsg.match(/retry in ([\d\.]+)s/i);
          if (retryMatch) {
            const secs = Math.ceil(parseFloat(retryMatch[1]));
            timeHint = currentLanguage === 'de' ? ` Warte ${secs}s.` : ` Wait ${secs}s.`;
          }
          const hint = currentLanguage === 'de' ? " (Tippen für Details)" : " (Tap for details)";
          if (response.status === 429 || retryMatch) {
            showDropdownNotification((currentLanguage === 'de' ? "KI Limit erreicht." : "AI Rate limit.") + timeHint + hint, true, () => showErrorDetailsModal(errorMsg));
          } else {
            showDropdownNotification("KI Fehler" + hint, true, () => showErrorDetailsModal(errorMsg));
          }
          return;
        }

        console.log("Antwort der KI erfolgreich empfangen:", data);

        if (data.candidates && data.candidates.length > 0) {
          const replyText = data.candidates[0].content.parts[0].text.trim();

          const replyMail = document.createElement('div');
          replyMail.className = 'mail-item unread';

          replyMail.innerHTML = `
            <div class="swipe-zone"></div>
            <div class="selection-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="mail-top">
              <span class="mail-sender">${senderName}</span>
              <span class="mail-time" data-timestamp="${Date.now()}">${translations[currentLanguage].just_now}</span>
            </div>
            <div class="mail-subject">Re: ${originalSubject.replace(/^Re:\s*/i, '')}</div>
            <div class="mail-preview">${replyText}</div>
          `;

          // Mit einer kleinen Verzögerung einfügen, damit es realistischer wirkt
          setTimeout(() => {
            addMailToDOM(replyMail, false);

            // Benachrichtigung anzeigen, wenn man sich nicht im Mail-Tab befindet
            const mailsPage = document.getElementById('page-mails');
            if (mailsPage && !mailsPage.classList.contains('active')) {
              showDropdownNotification(
                currentLanguage === 'de' ? `Neue E-Mail von ${senderName}` : `New email from ${senderName}`,
                false,
                () => {
                  switchTab('page-mails', document.querySelectorAll('.nav-item')[2]);
                  setTimeout(() => replyMail.click(), 300);
                }
              );
            }
          }, 1500);
        }
      } catch (error) {
        console.error("Fehler bei der KI-Antwort:", error);
        const errorMsg = error.message || error.toString();
        let timeHint = "";
        const retryMatch = errorMsg.match(/retry in ([\d\.]+)s/i);
        if (retryMatch) {
          const secs = Math.ceil(parseFloat(retryMatch[1]));
          timeHint = currentLanguage === 'de' ? ` Warte ${secs}s.` : ` Wait ${secs}s.`;
        }
        const hint = currentLanguage === 'de' ? " (Tippen für Details)" : " (Tap for details)";
        if (retryMatch) {
          showDropdownNotification((currentLanguage === 'de' ? "KI Limit erreicht." : "AI Rate limit.") + timeHint + hint, true, () => showErrorDetailsModal(errorMsg));
        } else {
          showDropdownNotification((currentLanguage === 'de' ? "Netzwerk/KI Fehler" : "Network/AI Error") + hint, true, () => showErrorDetailsModal(errorMsg));
        }
      }
    }

    let lastAiGenerationTime = 0;

    async function generateAiData() {
      const now = Date.now();
      // Spamschutz: 60 Sekunden (60.000 ms) Cooldown
      if (now - lastAiGenerationTime < 60000) {
        const remainingSeconds = Math.ceil((60000 - (now - lastAiGenerationTime)) / 1000);
        const waitMsgDe = `Bitte warte noch ${remainingSeconds} Sekunden.`;
        const waitMsgEn = `Please wait ${remainingSeconds} seconds.`;
        const waitMsgFi = `Odota vielä ${remainingSeconds} sekuntia.`;
        const waitMsg = currentLanguage === 'de' ? waitMsgDe : (currentLanguage === 'en' ? waitMsgEn : waitMsgFi);

        showDropdownNotification(waitMsg, true);
        return;
      }

      lastAiGenerationTime = now;

      showDropdownNotification(translations[currentLanguage].ai_generating || "KI generiert Daten...", false);

      const url = 'https://thd-app-backend.onrender.com/api/gemini';

      const prompt = `Erstelle zufällige, aber realistische Studiendaten für einen Medientechnik-Studenten in Deutschland.
Gib AUSSCHLIESSLICH ein valides JSON-Objekt zurück (kein Markdown, keine Backticks).
Nutze für Noten zwingend NUR die offiziellen Stufen (1,0; 1,3; 1,7; 2,0; 2,3; 2,7; 3,0; 3,3; 3,7; 4,0; 5,0) als String mit Komma.
Struktur:
{
  "mensaBalance": 24.50,
  "ects": 115,
  "studyCurrent": 4,
  "studyExtra": 0,
  "parkingSpots": 142,
  "parkingHistory": [15, 30, 50, 85, 95, 80, 60, 45, 30, 20, 10],
  "grades": {
    "Mediengestaltung": "1,3",
    "Programmieren 1": "2,0",
    "Audio- & Videotechnik": "1,7",
    "Mathematik": "2,3",
    "Medienrecht": "1,0",
    "Webentwicklung": "1,3",
    "Computergrafik": "2,7",
    "Datenbanksysteme": "2,0",
    "Projektmanagement": "1,3",
    "Englisch B2": "1,7",
    "Physik": "3,0",
    "Algorithmen & Datenstrukturen": "2,3"
  },
  "rentals": {
    "books": [
      {"title": "Mathematik für Ingenieure", "due": "In 3 Tagen", "loc": "Bibliothek", "person": "Ausleihe", "notes": "Rückgabe nur vormittags"}
    ],
    "tech": [
      {"title": "Sony Alpha 7 IV", "due": "Heute", "loc": "J Gebäude", "person": "Herr Bauer", "notes": "Inkl. 2 Akkus"}
    ]
  }
}
Variiere die Werte realistisch und zufällig!
Regeln für rentals: Max 3 Items pro Array (können auch leer sein). Für 'loc' nutze NUR diese Orte: A, B, C, D, E, F, G, H, I, J, K, L, ITC, Bibliothek. WICHTIG: Alles was mit Medien, Kameras, Audio, Video oder Grafiklabor zu tun hat, MUSS zwingend als loc "J Gebäude" haben!
parkingSpots: 0-200. parkingHistory: 11 Prozentwerte von 0-100.`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Google/Backend Fehler-Details:", data);
            throw new Error(data.error?.message || "API Limit oder Fehler");
        }

        let jsonStr = data.candidates[0].content.parts[0].text.trim();
        if(jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();

        const aiData = JSON.parse(jsonStr);

        mensaBalance = parseFloat(aiData.mensaBalance) || 0;
        updateMensaBalance(true);

        studyCurrent = parseInt(aiData.studyCurrent) || 1;
        studyExtra = parseInt(aiData.studyExtra) || 0;
        updateStudyTimeDisplay(true);

        if (aiData.parkingSpots !== undefined) {
            occupiedParkingSpots = Math.max(0, Math.min(200, parseInt(aiData.parkingSpots) || 0));
            updateParkingDisplay(true);
        }

        if (aiData.parkingHistory && Array.isArray(aiData.parkingHistory)) {
            const chartWrappers = document.querySelectorAll('#parking-chart-container .chart-bar-wrapper');
            aiData.parkingHistory.slice(0, 11).forEach((val, idx) => {
                if (chartWrappers[idx]) {
                    const bar = chartWrappers[idx].querySelector('.chart-bar');
                    if (bar) {
                        const h = Math.max(0, Math.min(100, parseInt(val) || 0));
                        bar.style.height = h + '%';
                        // Die schraffierten Zukunfts-Balken behalten ihre Farbe, die anderen bekommen grün/orange/rot
                        if (!bar.classList.contains('future')) {
                            bar.className = 'chart-bar ' + (h >= 80 ? 'high' : h >= 50 ? 'medium' : 'low');
                        }
                    }
                }
            });
        }

        const newEcts = parseInt(aiData.ects) || 0;
        const profileEctsValue = document.querySelector('#profile-ects-card .stat-value');
        if (profileEctsValue) profileEctsValue.innerText = newEcts;
        const homeEctsValue = document.querySelector('.ects-number');
        if (homeEctsValue) homeEctsValue.innerText = newEcts;

        if (aiData.grades) {
            const gradesList = document.querySelector('.grades-list');
            if (gradesList) {
                gradesList.innerHTML = '';
                for (const [course, grade] of Object.entries(aiData.grades)) {
                    const item = document.createElement('div');
                    item.className = 'list-item';
                    item.style.cursor = 'pointer';
                    item.setAttribute('onclick', `openGradeModal('${course}', '${grade}')`);
                    item.innerHTML = `<span>${course}</span><span class="grade-value sensitive-data">${grade}</span>`;
                    item.style.position = 'relative';
                    item.style.isolation = 'isolate';
                    gradesList.appendChild(item);
                }
            }
            const semEl = document.querySelector('[data-translate="profile_semester"]');
            if (semEl) {
                const semText = studyCurrent + ". Semester";
                semEl.innerText = semText;
                ['de', 'en', 'fi'].forEach(lang => {
                   let localizedSem = semText;
                   if (lang === 'en') localizedSem = studyCurrent + "th Semester";
                   if (lang === 'fi') localizedSem = studyCurrent + ". lukukausi";
                   translations[lang].profile_semester = localizedSem;
                });
            }
        }

        calculateGPAFromList(); // Nach dem Auffüllen der Noten automatisch ausrechnen

        if (aiData.rentals) {
            const updateRentalView = (viewId, items, emptyText, emptyKey) => {
                const view = document.getElementById(viewId);
                if (!view) return;
                view.innerHTML = '';
                if (!items || items.length === 0) {
                    view.innerHTML = `<div class="rental-empty"${emptyKey ? ` data-translate="${emptyKey}"` : ''}>${emptyText}</div>`;
                } else {
                    items.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'rental-item';
                        div.style.cursor = 'pointer';
                        const dueStr = (item.due || '').toLowerCase();
                        let dueClass = 'rental-item-due';
                        if (dueStr.includes('heute') || dueStr.includes('today') || dueStr.includes('fällig') || dueStr.includes('overdue')) {
                            dueClass += ' urgent';
                        } else if (dueStr.includes('morgen') || dueStr.includes('tomorrow') || dueStr.includes('1') || dueStr.includes('2')) {
                            dueClass += ' soon';
                        }

                        const escapeStr = str => (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

                        div.setAttribute('onclick', `openRentalModal('${escapeStr(item.title)}', this.querySelector('.rental-item-due').innerText, '${escapeStr(item.loc)}', '${escapeStr(item.person)}', '${escapeStr(item.notes)}', this)`);
                        div.innerHTML = `<span class="rental-item-title">${escapeStr(item.title)}</span><span class="${dueClass}">${escapeStr(item.due)}</span>`;

                        div.style.position = 'relative';
                        div.style.isolation = 'isolate';
                        view.appendChild(div);
                    });
                }
            };

            const emptyBooks = translations[currentLanguage].rental_books_empty || "Keine Bücher ausgeliehen.";
            const emptyTech = currentLanguage === 'de' ? 'Keine Technik ausgeliehen.' : (currentLanguage === 'en' ? 'No tech borrowed.' : 'Ei tekniikkaa lainassa.');

            updateRentalView('rental-books-view', aiData.rentals.books, emptyBooks, 'rental_books_empty');
            updateRentalView('rental-tech-view', aiData.rentals.tech, emptyTech, null);

            const activeRental = document.querySelector('#rental-views-container .rental-view.active');
            const viewport = document.getElementById('rental-views-viewport');
            if (activeRental && viewport) {
                viewport.style.height = activeRental.offsetHeight + 'px';
            }
        }

        if (isStorageEnabled()) saveAllData();
        showDropdownNotification(translations[currentLanguage].ai_generated || "Daten erfolgreich generiert!", false);
        closeModal();

      } catch (error) {
        console.error("KI Generierungs-Fehler:", error);
        const errorMsg = error.message || error.toString();
        let timeHint = "";
        const retryMatch = errorMsg.match(/retry in ([\d\.]+)s/i);
        if (retryMatch) {
          const secs = Math.ceil(parseFloat(retryMatch[1]));
          timeHint = currentLanguage === 'de' ? ` Warte ${secs}s.` : ` Wait ${secs}s.`;
        }
        const hint = currentLanguage === 'de' ? " (Tippen für Details)" : " (Tap for details)";
        if (retryMatch) {
          showDropdownNotification((currentLanguage === 'de' ? "KI Limit erreicht." : "AI Rate limit.") + timeHint + hint, true, () => showErrorDetailsModal(errorMsg));
        } else {
          showDropdownNotification((translations[currentLanguage].ai_error || "Fehler bei der KI-Generierung.") + hint, true, () => showErrorDetailsModal(errorMsg));
        }
      }
    }

    function openServicesModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('services-modal').classList.add('show');
      }, 10);
    }

    // --- Widget Drag & Drop Logik ---
    let dragState = {
        isDragging: false,
        wasDragging: false,
        element: null,
        placeholder: null,
        startY: 0,
        startX: 0,
        initialX: 0,
        initialY: 0,
        longPressTimer: null
    };

    let autoScrollInterval = null;
    let currentTouchX = 0;
    let currentTouchY = 0;

    document.addEventListener('mousemove', (e) => {
        currentTouchX = e.clientX;
        currentTouchY = e.clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
            currentTouchX = e.touches[0].clientX;
            currentTouchY = e.touches[0].clientY;
        }
    }, { passive: true });

    function initWidgetDragAndDrop() {
        const widgets = ['widget-ects', 'widget-schedule', 'widget-mensa', 'widget-parking', 'widget-rental', 'widget-vpn', 'widget-services', 'widget-weather', 'widget-todo'];

        widgets.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const startDrag = (e) => {
                // Verhindert Multitouch-Bugs (z.B. zwei Widgets gleichzeitig greifen)
                if (dragState.isDragging || dragState.longPressTimer) return;
                if (e.touches && e.touches.length > 1) return;

                // Ignoriere Klicks auf interaktive Bereiche wie Textfelder (Schalter, Listen & Segment-Buttons sind greifbar)
                if (e.target.closest('button:not(.segment-btn), input:not([type="checkbox"])')) return;

                // Nur Linksklick bei der Maus
                if (e.type === 'mousedown' && e.button !== 0) return;

                // Startposition sofort speichern (verhindert asynchrone Fehler auf Mobile)
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;

                currentTouchX = clientX;
                currentTouchY = clientY;

                dragState.startX = clientX;
                dragState.startY = clientY;

                dragState.longPressTimer = setTimeout(() => {
                    // Nur aufteilen, wenn auch wirklich eines der gruppierten Widgets bewegt wird
                    if (el.id === 'widget-vpn' || el.id === 'widget-services') {
                        unwrapRow('widget-bottom-row');
                    }
                    if (el.id === 'widget-ects' || el.id === 'widget-schedule') {
                        unwrapRow('widget-top-row');
                    }

                    const rect = el.getBoundingClientRect();

                    dragState.isDragging = true;
                    dragState.element = el;
                    document.body.classList.add('is-dragging-widget');

                    // Placeholder erstellen
                    dragState.placeholder = document.createElement('div');
                    dragState.placeholder.className = 'widget-placeholder';
                    dragState.placeholder.style.height = rect.height + 'px';

                    el.parentNode.insertBefore(dragState.placeholder, el.nextSibling);

                    // Element in den body verschieben, damit es im Tablet-Modus nicht von den
                    // Rändern des scrollbaren Containers (Barrikaden) abgeschnitten wird
                    document.body.appendChild(el);

                    // Zentriert das Widget beim Aufheben exakt in der Mitte unter dem Finger
                    dragState.initialX = currentTouchX - (rect.width / 2);
                    dragState.initialY = currentTouchY - (rect.height / 2);
                    dragState.startX = currentTouchX;
                    dragState.startY = currentTouchY;

                    // Styles für freies Bewegen anwenden
                    el.style.width = rect.width + 'px';
                    el.style.height = rect.height + 'px';
                    el.style.left = dragState.initialX + 'px';
                    el.style.top = dragState.initialY + 'px';
                    el.classList.add('widget-dragging');

                    // Haptisches Feedback (wenn verfügbar)
                    if (navigator.vibrate) navigator.vibrate(50);
                }, 400); // Löst nach 400ms Gedrückthalten aus
            };

            el.addEventListener('mousedown', startDrag);
            el.addEventListener('touchstart', startDrag, { passive: true });
        });

        const unwrapPreviewRow = () => {
            const rows = document.querySelectorAll('.preview-row');
            rows.forEach(row => {
                while(row.firstChild) {
                    if (row.firstChild.nodeType === 1) {
                        row.firstChild.style.margin = '';
                        row.firstChild.style.flex = '';
                    }
                    row.parentNode.insertBefore(row.firstChild, row);
                }
                row.remove();
            });
        };

        const checkPlacement = (x, y) => {
            const elemBelow = document.elementFromPoint(x, y);
            if (!elemBelow) return;

            // Flimmer-Schutz 1: Ignoriert den Platzhalter komplett
            if (elemBelow.closest('.widget-placeholder')) return;

            let targetWidget = elemBelow.closest('.top-widgets-row, .mensa-card, .parking-card, .rental-card, .vpn-card, .services-card, .bottom-widgets-row, .ects-free, .schedule-box');

            if (targetWidget && targetWidget !== dragState.placeholder && targetWidget !== dragState.element) {
                const isDraggingBottomHalf = dragState.element.id === 'widget-vpn' || dragState.element.id === 'widget-services';
                const isDraggingTopHalf = dragState.element.id === 'widget-ects' || dragState.element.id === 'widget-schedule';
                const isDraggingHalf = isDraggingBottomHalf || isDraggingTopHalf;

                // Flimmer-Schutz 2: Falls der Finger auf die Lücke in einer Reihe rutscht,
                // fokussieren wir das noch verbleibende Ziel-Widget darin, damit die Vorschau nicht abbricht.
                if (isDraggingBottomHalf && targetWidget.classList.contains('bottom-widgets-row')) {
                    const innerChild = Array.from(targetWidget.children).find(c => (c.id === 'widget-vpn' || c.id === 'widget-services') && c !== dragState.element);
                    if (innerChild) targetWidget = innerChild;
                }
                if (isDraggingTopHalf && targetWidget.classList.contains('top-widgets-row')) {
                    const innerChild = Array.from(targetWidget.children).find(c => (c.id === 'widget-ects' || c.id === 'widget-schedule') && c !== dragState.element);
                    if (innerChild) targetWidget = innerChild;
                }

                // Wenn ein großes Widget über ein gruppiertes kleines Widget gezogen wird,
                // nimm die ganze Reihe als Ziel, damit die kleinen in der Vorschau nicht getrennt werden.
                if (!isDraggingBottomHalf && (targetWidget.id === 'widget-vpn' || targetWidget.id === 'widget-services') && targetWidget.parentNode && targetWidget.parentNode.classList.contains('bottom-widgets-row')) {
                    targetWidget = targetWidget.parentNode;
                }
                if (!isDraggingTopHalf && (targetWidget.id === 'widget-ects' || targetWidget.id === 'widget-schedule') && targetWidget.parentNode && targetWidget.parentNode.classList.contains('top-widgets-row')) {
                    targetWidget = targetWidget.parentNode;
                }

                const rect = targetWidget.getBoundingClientRect();

                const isTargetBottomHalf = targetWidget.id === 'widget-vpn' || targetWidget.id === 'widget-services';
                const isTargetTopHalf = targetWidget.id === 'widget-ects' || targetWidget.id === 'widget-schedule';

                if ((isDraggingBottomHalf && isTargetBottomHalf) || (isDraggingTopHalf && isTargetTopHalf)) {
                    const rect = targetWidget.getBoundingClientRect();
                    const relY = y - rect.top;

                    // Befindet sich der Finger im oberen 25% oder unteren 25% Rand? => Stapeln (Vertikal)
                    const isVerticalPlacement = relY < rect.height * 0.25 || relY > rect.height * 0.75;

                    if (isVerticalPlacement) {
                        unwrapPreviewRow();
                        let targetParent = targetWidget.parentNode;
                        let insertReference = targetWidget;

                        if (targetParent.classList.contains('top-widgets-row') || targetParent.classList.contains('bottom-widgets-row')) {
                            insertReference = targetParent;
                            targetParent = targetParent.parentNode;
                        }

                        if (relY < rect.height * 0.5) {
                            targetParent.insertBefore(dragState.placeholder, insertReference);
                        } else {
                            targetParent.insertBefore(dragState.placeholder, insertReference.nextSibling);
                        }
                        dragState.placeholder.style.flex = '';
                        dragState.placeholder.style.margin = '0 15px 15px';
                    } else {
                        // Mitte 50% => Nebeneinander platzieren (Row)
                        const isLeft = x < rect.left + rect.width / 2;
                        let row = targetWidget.parentNode.classList.contains('preview-row') ? targetWidget.parentNode : null;

                        if (!row && targetWidget.parentNode && (targetWidget.parentNode.classList.contains('top-widgets-row') || targetWidget.parentNode.classList.contains('bottom-widgets-row'))) {
                            row = targetWidget.parentNode;
                        }

                        if (!row) {
                            unwrapPreviewRow();
                            row = document.createElement('div');
                            row.className = isDraggingBottomHalf ? 'bottom-widgets-row preview-row' : 'top-widgets-row preview-row';
                            targetWidget.parentNode.insertBefore(row, targetWidget);
                            row.appendChild(targetWidget);
                        }

                        if (isLeft) {
                            row.insertBefore(dragState.placeholder, targetWidget);
                        } else {
                            row.insertBefore(dragState.placeholder, targetWidget.nextSibling);
                        }

                        if (isDraggingTopHalf) {
                            dragState.placeholder.style.flex = dragState.element.id === 'widget-ects' ? '1' : '1.2';
                            targetWidget.style.flex = targetWidget.id === 'widget-ects' ? '1' : '1.2';
                        } else {
                            dragState.placeholder.style.flex = '1 1 0';
                            targetWidget.style.flex = '1 1 0';
                        }
                        dragState.placeholder.style.margin = '0';
                        targetWidget.style.margin = '0';
                    }
                } else {
                    unwrapPreviewRow();
                    const targetMiddle = rect.top + rect.height / 2;
                    let targetParent = targetWidget.parentNode;
                    let insertReference = targetWidget;

                    if (targetParent.classList.contains('top-widgets-row') || targetParent.classList.contains('bottom-widgets-row')) {
                        insertReference = targetParent;
                        targetParent = targetParent.parentNode;
                        const rowRect = insertReference.getBoundingClientRect();
                        if (y < rowRect.top + rowRect.height / 2) {
                            targetParent.insertBefore(dragState.placeholder, insertReference);
                        } else {
                            targetParent.insertBefore(dragState.placeholder, insertReference.nextSibling);
                        }
                    } else {
                        if (y < targetMiddle) {
                            targetParent.insertBefore(dragState.placeholder, insertReference);
                        } else {
                            targetParent.insertBefore(dragState.placeholder, insertReference.nextSibling);
                        }
                    }
                    dragState.placeholder.style.flex = '';
                    dragState.placeholder.style.margin = '0 15px 15px';
                }
            }
        };

        const stopDrag = () => {
            clearTimeout(dragState.longPressTimer);
            dragState.longPressTimer = null;
            clearInterval(autoScrollInterval);

            document.body.classList.remove('is-dragging-widget');

            if (!dragState.isDragging) return;

            dragState.wasDragging = true;
            setTimeout(() => dragState.wasDragging = false, 100);

            const el = dragState.element;

            el.classList.remove('widget-dragging');
            el.style.width = '';
            el.style.height = '';
            el.style.left = '';
            el.style.top = '';
            el.style.margin = '';
            el.style.flex = '';

            if (dragState.placeholder && dragState.placeholder.parentNode) {
                dragState.placeholder.parentNode.insertBefore(el, dragState.placeholder);
                dragState.placeholder.remove();
            }

            dragState.isDragging = false;
            dragState.element = null;
            dragState.placeholder = null;

            // Vorschau-Reihe nahtlos in echte Reihe umwandeln, um Layout-Sprünge zu vermeiden
            const previewRows = document.querySelectorAll('.preview-row');
            previewRows.forEach(row => {
                const isBottom = row.classList.contains('bottom-widgets-row');
                const isTop = row.classList.contains('top-widgets-row');

                if (isBottom) {
                    const vpn = document.getElementById('widget-vpn');
                    const services = document.getElementById('widget-services');
                    if (vpn && services && row.contains(vpn) && row.contains(services)) {
                        row.classList.remove('preview-row');
                        row.id = 'widget-bottom-row';
                        Array.from(row.children).forEach(c => {
                            c.style.flex = '';
                            c.style.margin = '';
                        });
                    }
                } else if (isTop) {
                    const ects = document.getElementById('widget-ects');
                    const sched = document.getElementById('widget-schedule');
                    if (ects && sched && row.contains(ects) && row.contains(sched)) {
                        row.classList.remove('preview-row');
                        row.id = 'widget-top-row';
                        Array.from(row.children).forEach(c => {
                            c.style.flex = '';
                            c.style.margin = '';
                        });
                    }
                }
            });

            // Aufräumen: Wenn eine echte Reihe nur noch 1 oder 0 Kinder hat, auflösen!
            ['widget-top-row', 'widget-bottom-row'].forEach(id => {
                const row = document.getElementById(id);
                if (row) {
                    const widgetsInRow = Array.from(row.children).filter(c => c.id && c.id.startsWith('widget-'));
                    if (widgetsInRow.length <= 1) {
                        while(row.firstChild) {
                            if (row.firstChild.nodeType === 1) {
                                row.firstChild.style.margin = '';
                                row.firstChild.style.flex = '';
                            }
                            row.parentNode.insertBefore(row.firstChild, row);
                        }
                        row.remove();
                    }
                }
            });

            unwrapPreviewRow();
            saveWidgetOrder(); // Reihenfolge permanent speichern
        };

        const moveDrag = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (!dragState.isDragging) {
                // Toleranz für "Touch-Jitter" (winziges Zittern des Fingers auf dem Display)
                if (dragState.longPressTimer) {
                    const dx = Math.abs(clientX - dragState.startX);
                    const dy = Math.abs(clientY - dragState.startY);

                    // Bricht das Halten erst ab, wenn > 10px gescrollt / gewischt wird
                    if (dx > 10 || dy > 10) {
                        clearTimeout(dragState.longPressTimer);
                        dragState.longPressTimer = null;
                    }
                }
                return;
            }

            e.preventDefault(); // Verhindert klassisches Scrollen während des Ziehens

            const dx = clientX - dragState.startX;
            const dy = clientY - dragState.startY;

            dragState.element.style.left = dragState.initialX + dx + 'px';
            dragState.element.style.top = dragState.initialY + dy + 'px';

            // Auto-Scrolling, wenn der Finger an den oberen oder unteren Rand gezogen wird
            const edgeThreshold = 100;
            const scrollContainer = document.getElementById('page-home');

            clearInterval(autoScrollInterval);
            autoScrollInterval = null;

            if (clientY < edgeThreshold) {
                autoScrollInterval = setInterval(() => {
                    scrollContainer.scrollTop -= 8;
                    checkPlacement(clientX, clientY);
                }, 16);
            } else if (clientY > window.innerHeight - edgeThreshold - 60) { // 60px für Navbar
                autoScrollInterval = setInterval(() => {
                    scrollContainer.scrollTop += 8;
                    checkPlacement(clientX, clientY);
                }, 16);
            }

            checkPlacement(clientX, clientY);
        };

        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchcancel', stopDrag);

        document.addEventListener('mousemove', moveDrag, { passive: false });
        document.addEventListener('touchmove', moveDrag, { passive: false });

        // Verhindert, dass das Ablegen auf einem klickbaren Widget aus Versehen dessen Funktion triggert
        document.addEventListener('click', (e) => {
            if (dragState.wasDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }

    function unwrapRow(rowId) {
        const row = document.getElementById(rowId);
        if (row) {
            while(row.firstChild) {
                if (row.firstChild.nodeType === 1) {
                    row.firstChild.style.margin = '';
                    row.firstChild.style.flex = '';
                }
                row.parentNode.insertBefore(row.firstChild, row);
            }
            row.remove();
        }
    }

    function wrapAdjacentHalfWidgets() {
        const home = document.getElementById('page-home');

        // Wrap bottom
        const vpn = document.getElementById('widget-vpn');
        const services = document.getElementById('widget-services');
        const existingBottomRow = document.getElementById('widget-bottom-row');

        if (!existingBottomRow || !vpn || !services || !existingBottomRow.contains(vpn) || !existingBottomRow.contains(services)) {
            unwrapRow('widget-bottom-row');

            if (vpn && services && home.contains(vpn) && home.contains(services)) {
                const widgets = Array.from(home.children).filter(c => c.id && c.id.startsWith('widget-'));
                const vpnIdx = widgets.indexOf(vpn);
                const srvIdx = widgets.indexOf(services);

                if (Math.abs(vpnIdx - srvIdx) === 1) {
                    const row = document.createElement('div');
                    row.id = 'widget-bottom-row';
                    row.className = 'bottom-widgets-row';

                    const first = vpnIdx < srvIdx ? vpn : services;
                    const second = vpnIdx < srvIdx ? services : vpn;

                    home.insertBefore(row, first);
                    row.appendChild(first);
                    row.appendChild(second);

                    if (first.classList.contains('widget-hidden') && second.classList.contains('widget-hidden')) {
                        row.classList.add('widget-hidden');
                    }
                }
            }
        }

        // Wrap top
        const ects = document.getElementById('widget-ects');
        const sched = document.getElementById('widget-schedule');
        const existingTopRow = document.getElementById('widget-top-row');

        if (!existingTopRow || !ects || !sched || !existingTopRow.contains(ects) || !existingTopRow.contains(sched)) {
            unwrapRow('widget-top-row');

            if (ects && sched && home.contains(ects) && home.contains(sched)) {
                const widgets = Array.from(home.children).filter(c => c.id && c.id.startsWith('widget-'));
                const ectsIdx = widgets.indexOf(ects);
                const schedIdx = widgets.indexOf(sched);

                if (Math.abs(ectsIdx - schedIdx) === 1) {
                    const row = document.createElement('div');
                    row.id = 'widget-top-row';
                    row.className = 'top-widgets-row';

                    const first = ectsIdx < schedIdx ? ects : sched;
                    const second = ectsIdx < schedIdx ? sched : ects;

                    home.insertBefore(row, first);
                    row.appendChild(first);
                    row.appendChild(second);

                    if (first.classList.contains('widget-hidden') && second.classList.contains('widget-hidden')) {
                        row.classList.add('widget-hidden');
                    }
                }
            }
        }
    }

    function saveWidgetOrder() {
            if (!isStorageEnabled()) return;
        const container = document.querySelector('.widget-column') || document.getElementById('page-home');
        const order = [];
        Array.from(container.children).forEach(child => {
            if (child.classList.contains('top-widgets-row') || child.classList.contains('bottom-widgets-row')) {
                const rowChildren = [];
                Array.from(child.children).forEach(c => { if(c.id) rowChildren.push(c.id); });
                if (rowChildren.length > 0) {
                    order.push({
                        row: child.classList.contains('top-widgets-row') ? 'widget-top-row' : 'widget-bottom-row',
                        children: rowChildren
                    });
                }
            } else if (child.id && child.id.startsWith('widget-')) {
                order.push(child.id);
            }
        });
        localStorage.setItem('thd_widget_order', JSON.stringify(order));
    }

    function loadWidgetOrder() {
        let savedOrder = JSON.parse(localStorage.getItem('thd_widget_order'));
        if (!savedOrder) {
            wrapAdjacentHalfWidgets();
            return;
        }

        // Migration alter Speicherstände (1D Array)
        if (savedOrder.length > 0 && typeof savedOrder[0] === 'string') {
            if (savedOrder.includes('widget-bottom-row')) {
                const idx = savedOrder.indexOf('widget-bottom-row');
                savedOrder.splice(idx, 1, 'widget-vpn', 'widget-services');
            }
            if (savedOrder.includes('widget-schedule') && !savedOrder.includes('widget-ects')) {
                const idx = savedOrder.indexOf('widget-schedule');
                savedOrder.splice(idx, 1, 'widget-ects', 'widget-schedule');
            }
            savedOrder = savedOrder.filter(id => id !== 'widget-bottom-row' && id !== 'widget-top-row');

            const newOrder = [];
            for (let i = 0; i < savedOrder.length; i++) {
                const id = savedOrder[i];
                if (id === 'widget-ects' || id === 'widget-schedule') {
                    if (i + 1 < savedOrder.length && ((id === 'widget-ects' && savedOrder[i+1] === 'widget-schedule') || (id === 'widget-schedule' && savedOrder[i+1] === 'widget-ects'))) {
                        newOrder.push({ row: 'widget-top-row', children: [id, savedOrder[i+1]] });
                        i++;
                    } else {
                        newOrder.push(id);
                    }
                } else if (id === 'widget-vpn' || id === 'widget-services') {
                    if (i + 1 < savedOrder.length && ((id === 'widget-vpn' && savedOrder[i+1] === 'widget-services') || (id === 'widget-services' && savedOrder[i+1] === 'widget-vpn'))) {
                        newOrder.push({ row: 'widget-bottom-row', children: [id, savedOrder[i+1]] });
                        i++;
                    } else {
                        newOrder.push(id);
                    }
                } else {
                    newOrder.push(id);
                }
            }
            savedOrder = newOrder;
        }

        const homePage = document.querySelector('.widget-column') || document.getElementById('page-home');
        const topSpacer = document.getElementById('dashboard-top-spacer');
        let insertAfter = topSpacer;

        savedOrder.forEach(item => {
            if (typeof item === 'string') {
                const el = document.getElementById(item);
                if (el) {
                    homePage.insertBefore(el, insertAfter.nextSibling);
                    insertAfter = el;
                }
            } else if (item.row && item.children) {
                let rowEl = document.getElementById(item.row);
                if (!rowEl) {
                    rowEl = document.createElement('div');
                    rowEl.id = item.row;
                    rowEl.className = item.row === 'widget-top-row' ? 'top-widgets-row' : 'bottom-widgets-row';
                }
                homePage.insertBefore(rowEl, insertAfter.nextSibling);
                insertAfter = rowEl;

                item.children.forEach(childId => {
                    const childEl = document.getElementById(childId);
                    if (childEl) {
                        rowEl.appendChild(childEl);
                    }
                });
            }
        });
    }

    // --- Profilbild Logik ---
    function handleProfilePicUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;
                setProfilePic(dataUrl);
                if (isStorageEnabled()) {
                    localStorage.setItem('thd_profile_pic', dataUrl);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    function setProfilePic(dataUrl) {
        const img = document.getElementById('profile-pic-img');
        const svg = document.getElementById('profile-pic-svg');
        if (img && svg) {
            img.src = dataUrl;
            img.style.display = 'block';
            svg.style.display = 'none';
        }
    }

    function editProfileName() {
        const nameEl = document.getElementById('profile-name-display');
        const inputEl = document.getElementById('edit-name-input');
        if (!nameEl || !inputEl) return;

        inputEl.value = nameEl.innerText;

        document.getElementById('modal-overlay').classList.add('show');
        setTimeout(() => {
            document.getElementById('edit-name-modal').classList.add('show');
            inputEl.focus();
        }, 10);
    }

    function saveProfileName() {
        const nameEl = document.getElementById('profile-name-display');
        const inputEl = document.getElementById('edit-name-input');
        if (!nameEl || !inputEl) return;

        let newName = inputEl.value.trim();
        if (newName !== '') {
            newName = newName.substring(0, 20); // Auf 20 Zeichen begrenzen, um KI Prompt kurz zu halten
            nameEl.innerText = newName;
            if (isStorageEnabled()) {
                localStorage.setItem('thd_profile_name', newName);
            }
        }
        closeModal();
    }

    // --- Data Storage Logik ---
    function isStorageEnabled() {
        // Standardmäßig an: Gibt nur false zurück, wenn es explizit vom Nutzer deaktiviert wurde
        return localStorage.getItem('thd_storage_enabled') !== 'false';
    }

    function togglePrivacyMode(enabled) {
        isPrivacyModeEnabled = enabled;
        if (enabled) {
            document.body.classList.add('privacy-mode');
        } else {
            document.body.classList.remove('privacy-mode');
        }
        if (isStorageEnabled()) {
            localStorage.setItem('thd_privacy_mode', enabled ? 'true' : 'false');
        }
    }

    function toggleStorage(enabled) {
        if (enabled) {
            localStorage.setItem('thd_storage_enabled', 'true');
            saveAllData();
        } else {
            localStorage.setItem('thd_storage_enabled', 'false');
            // Alle Daten löschen, außer der Einstellung selbst
        const keysToRemove = ['thd_widget_order', 'thd_mensa_balance', 'thd_gpa', 'thd_parking_spots', 'thd_ects', 'thd_ects_scroll_index', 'thd_study_current', 'thd_study_total', 'thd_study_extra', 'thd_mails_html', 'thd_ilearn_html', 'thd_search_history', 'thd_profile_pic', 'thd_profile_name', 'thd_schedule_cache', 'thd_mensa_cache', 'thd_news_cache', 'thd_favorite_events', 'thd_real_mode', 'thd_privacy_mode', 'thd_theme', 'thd_language', 'thd_widget_visibility', 'thd_vpn_state', 'thd_setup_completed', 'thd_study_group', 'thd_grades_html', 'thd_profile_semester', 'thd_rental_books_html', 'thd_rental_tech_html', 'thd_parking_history_html', 'thd_rental_view'];
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }
    }

    function toggleRealMode(enabled) {
        isRealModeEnabled = enabled;
        if (isStorageEnabled()) {
            localStorage.setItem('thd_real_mode', enabled ? 'true' : 'false');
        }

        if (enabled) {
            loadRealMensaData();
            loadSchedule();
            loadNewsEvents();
        } else {
          // Dummy-Daten wiederherstellen ohne Reload
          const mensaList = document.querySelector('#widget-mensa .scroll-list');
          if (mensaList && dummyMensaHTML) mensaList.innerHTML = dummyMensaHTML;
          const scheduleBox = document.getElementById('widget-schedule');
          if (scheduleBox && dummyScheduleHTML) {
              scheduleBox.innerHTML = dummyScheduleHTML;
              window.allScheduleEvents = []; // Echte Kalender-Events löschen
              widgetSelectedDay = -1;
              updateScheduleProgress(true, true); // Fortschrittsbalken und Scroll-Pos aktualisieren
          }
          loadNewsEvents();
        }
    }

    function saveAllData() {
        if (!isStorageEnabled()) return;

        saveWidgetOrder();

        localStorage.setItem('thd_mensa_balance', mensaBalance);
        localStorage.setItem('thd_gpa', currentGPA);
        localStorage.setItem('thd_parking_spots', occupiedParkingSpots);

        localStorage.setItem('thd_study_current', studyCurrent);
        localStorage.setItem('thd_study_total', studyTotal);
        localStorage.setItem('thd_study_extra', studyExtra);
        localStorage.setItem('thd_study_group', currentStudyGroup);

        const homeEctsValue = document.querySelector('.ects-number');
        if (homeEctsValue) localStorage.setItem('thd_ects', homeEctsValue.innerText);

        const widgetEcts = document.getElementById('widget-ects');
        if (widgetEcts) {
            const index = Math.round(widgetEcts.scrollTop / 150);
            localStorage.setItem('thd_ects_scroll_index', index);
        }

        const mailsViewList = document.querySelector('#mails-view .mail-list');
        if (mailsViewList) localStorage.setItem('thd_mails_html', mailsViewList.innerHTML);

        const ilearnViewList = document.querySelector('#ilearn-view .mail-list');
        if (ilearnViewList) localStorage.setItem('thd_ilearn_html', ilearnViewList.innerHTML);

        const gradesList = document.querySelector('.grades-list');
        if (gradesList) localStorage.setItem('thd_grades_html', gradesList.innerHTML);

        const semEl = document.querySelector('[data-translate="profile_semester"]');
        if (semEl) localStorage.setItem('thd_profile_semester', semEl.innerText);

        const rentalBooksView = document.getElementById('rental-books-view');
        if (rentalBooksView) localStorage.setItem('thd_rental_books_html', rentalBooksView.innerHTML);

        const rentalTechView = document.getElementById('rental-tech-view');
        if (rentalTechView) localStorage.setItem('thd_rental_tech_html', rentalTechView.innerHTML);

        const parkingChart = document.getElementById('parking-chart-container');
        if (parkingChart) localStorage.setItem('thd_parking_history_html', parkingChart.innerHTML);

        const activeRentalBtn = document.querySelector('#rental-segments .segment-btn.active');
        if (activeRentalBtn) {
            localStorage.setItem('thd_rental_view', activeRentalBtn.getAttribute('onclick').includes('books') ? 'books' : 'tech');
        }

        const widgetVisibility = {};
        document.querySelectorAll('#widget-settings-modal .toggle-input').forEach(input => {
            const match = input.getAttribute('onchange')?.match(/'([^']+)'/);
            if (match) {
                widgetVisibility[match[1]] = input.checked;
            }
        });
        localStorage.setItem('thd_widget_visibility', JSON.stringify(widgetVisibility));

        const vpnToggle = document.getElementById('vpn-toggle');
        if (vpnToggle) localStorage.setItem('thd_vpn_state', vpnToggle.checked);

        localStorage.setItem('thd_favorite_events', JSON.stringify(Array.from(favoriteEvents)));
    }

    function loadAllData() {
        const toggle = document.getElementById('storage-toggle');
        if (toggle) toggle.checked = isStorageEnabled();

        const savedTheme = localStorage.getItem('thd_theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            setTheme('dark');
        }

        const savedLanguage = localStorage.getItem('thd_language');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        }

        const savedRealMode = localStorage.getItem('thd_real_mode');
        if (savedRealMode !== null) {
            isRealModeEnabled = savedRealMode === 'true';
        }
        const realToggle = document.getElementById('real-mode-toggle');
        if (realToggle) realToggle.checked = isRealModeEnabled;

        const savedPrivacyMode = localStorage.getItem('thd_privacy_mode');
        if (savedPrivacyMode !== null) {
            isPrivacyModeEnabled = savedPrivacyMode === 'true';
        }
        const privacyToggle = document.getElementById('privacy-mode-toggle');
        if (privacyToggle) privacyToggle.checked = isPrivacyModeEnabled;
        if (isPrivacyModeEnabled) document.body.classList.add('privacy-mode');

        const savedStudyGroup = localStorage.getItem('thd_study_group');
        if (savedStudyGroup !== null) {
            currentStudyGroup = savedStudyGroup;
        }

        // Initial den Studiengang auch im Profil aktualisieren
        const majorEl = document.querySelector('[data-translate="profile_major"]');
        if (majorEl) {
            const displayName = getFullMajorName(currentStudyGroup);
            majorEl.innerText = displayName;
            ['de', 'en', 'fi'].forEach(lang => {
                if (translations[lang]) translations[lang].profile_major = displayName;
            });
        }

        loadTodos();
        if (!isStorageEnabled()) return;

        const savedBalance = localStorage.getItem('thd_mensa_balance');
        if (savedBalance !== null) { mensaBalance = parseFloat(savedBalance); updateMensaBalance(false); }

        const savedGPA = localStorage.getItem('thd_gpa');
        if (savedGPA !== null) {
            currentGPA = parseFloat(savedGPA);
            const gpaEl = document.getElementById('profile-gpa-value');
            if (gpaEl) gpaEl.innerText = currentGPA.toFixed(1).replace('.', ',');
            const homeGpaEl = document.getElementById('home-gpa-number');
            if (homeGpaEl) homeGpaEl.innerText = currentGPA.toFixed(1).replace('.', ',');
        }

        const savedParking = localStorage.getItem('thd_parking_spots');
    if (savedParking !== null) { occupiedParkingSpots = parseInt(savedParking, 10); }

        const savedEcts = localStorage.getItem('thd_ects');
        if (savedEcts !== null) {
            const profileEctsValue = document.querySelector('#profile-ects-card .stat-value');
            if (profileEctsValue) profileEctsValue.innerText = savedEcts;
            const homeEctsValue = document.querySelector('.ects-number');
            if (homeEctsValue) homeEctsValue.innerText = savedEcts;
        }

        const savedEctsScrollIndex = localStorage.getItem('thd_ects_scroll_index');
        if (savedEctsScrollIndex !== null) {
            setTimeout(() => {
                const widgetEcts = document.getElementById('widget-ects');
                if (widgetEcts) {
                    widgetEcts.style.scrollSnapType = 'none';
                    widgetEcts.scrollTop = parseInt(savedEctsScrollIndex, 10) * 150;
                setTimeout(() => widgetEcts.style.scrollSnapType = 'y mandatory', 50);
                }
            }, 50);
        }

        const savedStudyCurrent = localStorage.getItem('thd_study_current');
        if (savedStudyCurrent !== null) studyCurrent = parseInt(savedStudyCurrent, 10);

        const savedStudyTotal = localStorage.getItem('thd_study_total');
        if (savedStudyTotal !== null) studyTotal = parseInt(savedStudyTotal, 10);

        const savedStudyExtra = localStorage.getItem('thd_study_extra');
        if (savedStudyExtra !== null) studyExtra = parseInt(savedStudyExtra, 10);

        updateStudyTimeDisplay(false); // Aktualisiert Graphen & Texte basierend auf den Variablen

        const savedMailsHtml = localStorage.getItem('thd_mails_html');
        if (savedMailsHtml !== null) {
            const mailsViewList = document.querySelector('#mails-view .mail-list');
            if (mailsViewList) {
                // Stellt die verschobenen/gelöschten Mails exakt so wieder her
                mailsViewList.innerHTML = savedMailsHtml;
                // Reaktiviert die Klick-Funktionen für die reingeladenen Mails
                const mailItems = mailsViewList.querySelectorAll('.mail-item');
                mailItems.forEach(item => attachMailEventListeners(item));
                updateUnreadBadge();
            }
        }

        const savedGradesHtml = localStorage.getItem('thd_grades_html');
        if (savedGradesHtml !== null) {
            const gradesList = document.querySelector('.grades-list');
            if (gradesList) gradesList.innerHTML = savedGradesHtml;
        }

        const savedSemester = localStorage.getItem('thd_profile_semester');
        if (savedSemester !== null) {
            const semEl = document.querySelector('[data-translate="profile_semester"]');
            if (semEl) {
                semEl.innerText = savedSemester;
                // Sprache überschreiben, um den String für Sprache-Switches aufrechtzuerhalten
                ['de', 'en', 'fi'].forEach(lang => translations[lang].profile_semester = savedSemester);
            }
        }

        const savedRentalBooks = localStorage.getItem('thd_rental_books_html');
        if (savedRentalBooks !== null) {
            const rentalBooksView = document.getElementById('rental-books-view');
            if (rentalBooksView) rentalBooksView.innerHTML = savedRentalBooks;
        }

        const savedRentalTech = localStorage.getItem('thd_rental_tech_html');
        if (savedRentalTech !== null) {
            const rentalTechView = document.getElementById('rental-tech-view');
            if (rentalTechView) rentalTechView.innerHTML = savedRentalTech;
        }

        const savedRentalView = localStorage.getItem('thd_rental_view');
        if (savedRentalView !== null) {
            const rentalBtn = document.querySelector(`#rental-segments .segment-btn[onclick*="${savedRentalView}"]`);
            if (rentalBtn) {
                switchRentalView(savedRentalView, rentalBtn);
            }
        }

        const savedParkingChartHtml = localStorage.getItem('thd_parking_history_html');
        if (savedParkingChartHtml !== null) {
            const parkingChart = document.getElementById('parking-chart-container');
            if (parkingChart) parkingChart.innerHTML = savedParkingChartHtml;
        }

        const savedProfilePic = localStorage.getItem('thd_profile_pic');
        if (savedProfilePic !== null) {
            setProfilePic(savedProfilePic);
        }

        const savedProfileName = localStorage.getItem('thd_profile_name');
        if (savedProfileName !== null) {
            const nameEl = document.getElementById('profile-name-display');
            if (nameEl) nameEl.innerText = savedProfileName;
        }

        const cachedMensa = localStorage.getItem('thd_mensa_cache');
        if (cachedMensa) {
            try {
                const parsed = JSON.parse(cachedMensa);
                mensaDataCache = parsed.data; // Immer übernehmen (Stale-while-revalidate)

                if (Date.now() - parsed.timestamp >= 3600000 && isRealModeEnabled) {
                    setTimeout(() => loadRealMensaData(true), 2000); // Veralteten Cache im Hintergrund stumm aktualisieren
                }
            } catch(e) {}
        }

        const savedFavorites = localStorage.getItem('thd_favorite_events');
        if (savedFavorites) {
            favoriteEvents = new Set(JSON.parse(savedFavorites));
        }

        loadWidgetOrder();
        checkEmptyMailLists();
        calculateGPAFromList(); // Den anfänglichen Notenschnitt ebenfalls korrekt aus der Liste laden
    }

    function setupTabletLayout() {
        const isTablet = window.innerWidth >= 768 && window.matchMedia("(orientation: landscape)").matches;
        const homePage = document.getElementById('page-home');
        const isSetup = homePage.querySelector('.tablet-wrapper');

        if (isTablet && !isSetup) {
            const wrapper = document.createElement('div');
            wrapper.className = 'tablet-wrapper';

            const widgetCol = document.createElement('div');
            widgetCol.className = 'widget-column';

            const mailColWrapper = document.createElement('div');
            mailColWrapper.className = 'mail-column-wrapper';

            const mailCol = document.createElement('div');
            mailCol.className = 'mail-column';

            const topSpacer = document.getElementById('dashboard-top-spacer');
            const bottomSpacer = document.getElementById('dashboard-bottom-spacer');

            let current = topSpacer.nextElementSibling;
            while (current && current !== bottomSpacer) {
                const next = current.nextElementSibling;
                widgetCol.appendChild(current);
                current = next;
            }

            // Mail-Spalte befüllen
            const mailsView = document.querySelector('#mails-view .mail-list');
            const ilearnView = document.querySelector('#ilearn-view .mail-list');

            if (mailsView && ilearnView) {
                 mailCol.innerHTML = `
                    <div style="padding: 0 0 15px 0; font-size: 20px; flex-shrink: 0; font-weight: 400;">E-Mails</div>
                    <div class="mail-list" style="padding: 0; gap: 12px; flex: 1; overflow-y: auto; min-height: 0;">${mailsView.innerHTML}</div>
                    <div style="padding: 25px 0 15px 0; font-size: 20px; flex-shrink: 0; font-weight: 400;">iLearn Benachrichtigungen</div>
                    <div class="mail-list" style="padding: 0 0 15px 0; gap: 12px; flex: 1; overflow-y: auto; min-height: 0;">${ilearnView.innerHTML}</div>
                `;
                // Wichtig: Event-Listener für die geklonten Mails neu anhängen
                mailCol.querySelectorAll('.mail-item').forEach(item => attachMailEventListeners(item));
            }

            mailColWrapper.appendChild(mailCol);
            wrapper.appendChild(widgetCol);
            wrapper.appendChild(mailColWrapper);

            homePage.insertBefore(wrapper, bottomSpacer);
            checkEmptyMailLists();

        } else if (!isTablet && isSetup) {
            // Tablet-Ansicht abbauen und zur mobilen Ansicht zurückkehren
            const wrapper = homePage.querySelector('.tablet-wrapper');
            const widgetCol = wrapper.querySelector('.widget-column');
            const bottomSpacer = document.getElementById('dashboard-bottom-spacer');

            if (widgetCol) {
                // Elemente zurück an die richtige Stelle im DOM verschieben
                while (widgetCol.firstChild) {
                    homePage.insertBefore(widgetCol.firstChild, bottomSpacer);
                }
            }
            wrapper.remove();
        }
    }

    // --- VPN Chart Logik ---
    function openVpnStatsModal() {
      document.getElementById('modal-overlay').classList.add('show');
      setTimeout(() => {
        document.getElementById('vpn-stats-modal').classList.add('show');
        if (typeof updateVpnChart === 'function') updateVpnChart(); // Sofort einmal zeichnen
      }, 10);
    }

    const vpnCanvas = document.getElementById('vpn-chart');
    const vpnCtx = vpnCanvas ? vpnCanvas.getContext('2d') : null;
    const maxPoints = 40;

    // Initial mit Daten füllen, damit der Graph beim Öffnen sofort voll ist
    let dlData = Array.from({length: maxPoints}, () => Math.random() * 25);
    let ulData = Array.from({length: maxPoints}, () => Math.random() * 15);

    // Zeichnen-Logik in eine Funktion verpackt
    function updateVpnChart() {
      // Prüfen, ob VPN verbunden ist
      const isConnected = document.getElementById('vpn-toggle').checked;

      // Daten immer generieren, damit der Graph im Hintergrund "weiterlebt"
      const newDl = isConnected ? Math.random() * 25 : 0;
      const newUl = isConnected ? Math.random() * 15 : 0;

      dlData.push(newDl); dlData.shift();
      ulData.push(newUl); ulData.shift();

      // Nur zeichnen und DOM updaten, wenn das Fenster offen ist
      if (!document.getElementById('vpn-stats-modal').classList.contains('show') || !vpnCtx) return;

      // --- High-DPI und Responsive Canvas ---
      const dpr = window.devicePixelRatio || 1;

      // clientWidth/clientHeight nutzen, da getBoundingClientRect() durch scaleY verfälscht wird
      const rectWidth = vpnCanvas.clientWidth;
      const rectHeight = vpnCanvas.clientHeight;

      // Prüfen, ob die Größe angepasst werden muss (initial oder bei resize)
      if (vpnCanvas.width !== rectWidth * dpr || vpnCanvas.height !== rectHeight * dpr) {
        if (rectWidth > 0 && rectHeight > 0) {
          vpnCanvas.width = rectWidth * dpr;
          vpnCanvas.height = rectHeight * dpr;
          vpnCtx.scale(dpr, dpr);
        }
      }

      const width = rectWidth;
      const height = rectHeight;

      // Wenn das Canvas nicht sichtbar ist, hat es keine Größe -> abbrechen
      if (width === 0 || height === 0) return;

      document.getElementById('vpn-dl-text').innerText = newDl.toFixed(2);
      document.getElementById('vpn-ul-text').innerText = newUl.toFixed(2);

      // Canvas leeren
      vpnCtx.clearRect(0, 0, width, height);

      // Hilfsfunktion zum Zeichnen der Graphen
      function drawGraph(dataArray, strokeColor, fillColor) {
        // 1. Gefüllten Bereich zeichnen
        vpnCtx.beginPath();
        vpnCtx.moveTo(0, height);
        for (let i = 0; i < maxPoints; i++) {
          const x = (i / (maxPoints - 1)) * width;
          const y = height - (dataArray[i] * 4); // Skalierung der Höhe
          vpnCtx.lineTo(x, y);
        }
        vpnCtx.lineTo(width, height);
        vpnCtx.closePath();

        vpnCtx.fillStyle = fillColor;
        vpnCtx.fill();

        // 2. Linie darüber zeichnen
        vpnCtx.beginPath();
        vpnCtx.moveTo(0, height - (dataArray[0] * 4));
        for (let i = 1; i < maxPoints; i++) {
          const x = (i / (maxPoints - 1)) * width;
          const y = height - (dataArray[i] * 4);
          vpnCtx.lineTo(x, y);
        }

        vpnCtx.strokeStyle = strokeColor;
        vpnCtx.lineWidth = 2;
        vpnCtx.stroke();
      }

      const isLight = document.body.classList.contains('theme-light');
      const fillAlpha = isLight ? '0.15' : '0.2';

      // Zeichne Upload (Rot) und Download (Grün)
      drawGraph(ulData, '#FF3B30', `rgba(255, 59, 48, ${fillAlpha})`);
      drawGraph(dlData, '#3ad961', `rgba(52, 199, 89, ${fillAlpha})`);
    }

    // Updated fortlaufend alle 500ms
    setInterval(updateVpnChart, 500);

    // Dynamische Berechnung des Stundenplan-Fortschritts
    function updateScheduleProgress(isInitialLoad = false, animate = false) {
      const now = new Date();
      if (!isRealModeEnabled) {
        now.setHours(12, 16, 0, 0); // Im Demo-Modus die Uhrzeit auf exakt 12:16 Uhr einfrieren
      }
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      let activeIndex = -1;
      let nextIndex = -1;

      let isPastDay = false;
      let isFutureDay = false;

      // Berechne, ob der im Widget angezeigte Tag in der Vergangenheit oder Zukunft liegt
      if (widgetSelectedDay !== -1) {
          const todayDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
          const dayOffset = (widgetSelectedDay - todayDayIndex) + (widgetSelectedWeekOffset * 7);

          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() + dayOffset);
          targetDate.setHours(0,0,0,0);

          const todayDate = new Date(now);
          todayDate.setHours(0,0,0,0);

          if (targetDate < todayDate) isPastDay = true;
          else if (targetDate > todayDate) isFutureDay = true;
      }

      document.querySelectorAll('.schedule-item').forEach((item, index) => {
        const timeEl = item.querySelector('.schedule-time');
        if (!timeEl) return;

        // Sicheres Auslesen der Uhrzeiten via Regex (ignoriert Text wie "Raum: ...")
        const match = timeEl.innerText.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (match) {
          const startMins = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
          const endMins = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);

          let progress = 0;
          let isActive = false;
          if (isPastDay) {
            progress = 100;
          } else if (isFutureDay) {
            progress = 0;
          } else {
            // Es handelt sich um den heutigen Tag
            if (currentMinutes >= endMins) {
              progress = 100; // Fach ist bereits vorbei
            } else if (currentMinutes >= startMins) {
              progress = ((currentMinutes - startMins) / (endMins - startMins)) * 100; // Fach läuft gerade
              activeIndex = index;
              isActive = true;
            } else if (currentMinutes < startMins && nextIndex === -1) {
              nextIndex = index; // Nächstes in der Zukunft liegendes Fach
            }
          }

          const fillEl = item.querySelector('.schedule-progress-fill');
          if (fillEl) {
            // Animation entfernen und Reflow erzwingen, damit die Animation bei Bedarf neu starten kann
            fillEl.classList.remove('animate-active');
            void fillEl.offsetWidth;

            fillEl.style.width = progress + '%';

            if (isActive && animate) {
              fillEl.classList.add('animate-active');
            }
          }
        }
      });

      // Beim ersten Laden automatisch zum aktuellen Fach scrollen
      if (isInitialLoad) {
        const items = document.querySelectorAll('.schedule-item');
        let targetIndex = 0;

        if (isPastDay) {
            targetIndex = Math.max(0, items.length - 2); // Ganz nach unten scrollen
        } else if (isFutureDay) {
            targetIndex = 0; // Ganz oben bleiben
        } else {
            let focusIndex = activeIndex !== -1 ? activeIndex : (nextIndex !== -1 ? nextIndex : items.length - 1);
            // Zeige die aktive/nächste Stunde im unteren Slot an, beendete darüber
            targetIndex = Math.max(0, focusIndex - 1);
        }

        const scheduleBox = document.getElementById('widget-schedule');
        if (scheduleBox) {
          scheduleBox.style.scrollSnapType = 'none'; // Snapping kurz ausstellen für weiches Scrollen
          scheduleBox.scrollTop = 0; // Setzt die Liste unsichtbar nach ganz oben zurück
          if (targetIndex > 0) {
            setTimeout(() => {
              scheduleBox.scrollTo({
                top: targetIndex * 80, // 68px Kachelhöhe + 12px Lücke
                behavior: 'smooth'
              });
              // Snapping nach dem Scrollen wieder aktivieren
          setTimeout(() => scheduleBox.style.scrollSnapType = 'y mandatory', 600);
            }, 100); // Schnellerer Start der Scroll-Animation
          } else {
        scheduleBox.style.scrollSnapType = 'y mandatory';
          }
        }
      }
    }

    function setTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-oled');
        document.body.classList.add('theme-' + theme);

        // Meta Tags für das Betriebssystem (Mobile Statusbar) aktualisieren
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            if (theme === 'light') metaThemeColor.setAttribute('content', '#EBEBF0');
            else if (theme === 'oled') metaThemeColor.setAttribute('content', '#0A0A0A');
            else metaThemeColor.setAttribute('content', '#000000');
        }
        const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
        if (metaColorScheme) {
            metaColorScheme.setAttribute('content', theme === 'light' ? 'light' : 'dark');
        }

        let index = 1; // standard dunkel
        if (theme === 'light') index = 0;
        else if (theme === 'oled') index = 2;

        // Einstellungen Modal
        document.querySelectorAll('#theme-segments .segment-btn').forEach(b => b.classList.remove('active'));
        const targetBtn1 = document.getElementById('theme-btn-' + theme);
        if (targetBtn1) targetBtn1.classList.add('active');
        const highlight1 = document.getElementById('theme-segment-highlight');
        if (highlight1) highlight1.style.transform = `translateX(${index * 100}%)`;

        // Setup Modal
        document.querySelectorAll('#setup-theme-segments .segment-btn').forEach(b => b.classList.remove('active'));
        const targetBtn2 = document.getElementById('setup-theme-btn-' + theme);
        if (targetBtn2) targetBtn2.classList.add('active');
        const highlight2 = document.getElementById('setup-theme-segment-highlight');
        if (highlight2) highlight2.style.transform = `translateX(${index * 100}%)`;

        if (isStorageEnabled()) {
            localStorage.setItem('thd_theme', theme);
        }
    }

// --- ToDo Widget Logic ---
let todoItems = [
    { text: "Übungsblatt Mathe machen", checked: false },
    { text: "Buch zurückgeben", checked: true }
];

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = '';
    todoItems.forEach((todo, idx) => {
        list.appendChild(createTodoElement(todo, idx));
    });
}

function createTodoElement(todo) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'todo-item' + (todo.checked ? ' checked' : '');

    const checkbox = document.createElement('div');
    checkbox.className = 'todo-checkbox' + (todo.checked ? ' checked' : '');
    checkbox.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    checkbox.onclick = (e) => {
        e.stopPropagation();
        toggleTodo(todo, itemDiv, checkbox);
    };

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.innerText = todo.text;
    textSpan.contentEditable = true;
    textSpan.onblur = (e) => {
        updateTodoText(todo, e.target.innerText, itemDiv);
    };
    textSpan.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    };

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'todo-delete';
    deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-sub)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.padding = '4px';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        removeTodo(todo, itemDiv);
    };

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(textSpan);
    itemDiv.appendChild(deleteBtn);
    return itemDiv;
}

function toggleTodo(todo, itemDiv, checkbox) {
    const index = todoItems.indexOf(todo);
    if (index > -1) {
        todoItems[index].checked = !todoItems[index].checked;
        if (todoItems[index].checked) {
            itemDiv.classList.add('checked');
            checkbox.classList.add('checked');
        } else {
            itemDiv.classList.remove('checked');
            checkbox.classList.remove('checked');
        }
        saveTodos();
    }
}

function updateTodoText(todo, text, itemDiv) {
    const index = todoItems.indexOf(todo);
    if (index > -1) {
        if (text.trim() === '') {
            removeTodo(todo, itemDiv);
        } else {
            todoItems[index].text = text;
            saveTodos();
        }
    }
}

function removeTodo(todo, itemDiv) {
    const index = todoItems.indexOf(todo);
    if (index > -1) {
        todoItems.splice(index, 1);

        // Smoothly animate the removal to prevent jumping
        itemDiv.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        itemDiv.style.opacity = '0';
        itemDiv.style.transform = 'scaleY(0.5) translateX(20px)';
        itemDiv.style.maxHeight = '0px';
        itemDiv.style.paddingTop = '0px';
        itemDiv.style.paddingBottom = '0px';
        itemDiv.style.borderWidth = '0px';
        itemDiv.style.overflow = 'hidden';

        setTimeout(() => {
            itemDiv.remove();
        }, 300);
        saveTodos();
    }
}

function addTodoItem() {
    const newTodo = { text: "", checked: false };
    todoItems.unshift(newTodo);

    const list = document.getElementById('todo-list');
    if (!list) return;

    const newEl = createTodoElement(newTodo);
    newEl.style.opacity = '0';
    newEl.style.transform = 'scaleY(0.5) translateX(-20px)';
    newEl.style.maxHeight = '0px';
    newEl.style.paddingTop = '0px';
    newEl.style.paddingBottom = '0px';
    newEl.style.borderWidth = '0px';
    newEl.style.overflow = 'hidden';

    list.prepend(newEl);

    // Reflow
    void newEl.offsetHeight;

    // Animate in
    newEl.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    newEl.style.opacity = '1';
    newEl.style.transform = 'scaleY(1) translateX(0)';
    newEl.style.maxHeight = '50px'; // Oder eine andere ausreichend große Höhe
    newEl.style.paddingTop = '';
    newEl.style.paddingBottom = '';
    newEl.style.borderWidth = '';

    setTimeout(() => {
        newEl.style.overflow = '';
    }, 400);

    const textSpan = newEl.querySelector('.todo-text');
    if (textSpan) {
        textSpan.focus();
    }

    saveTodos();
}

function saveTodos() {
    if (isStorageEnabled()) {
        localStorage.setItem('thd_todos', JSON.stringify(todoItems));
    }
}

function loadTodos() {
    const saved = localStorage.getItem('thd_todos');
    if (saved) {
        try {
            todoItems = JSON.parse(saved);
        } catch(e) {}
    }
    renderTodos();
}

function toggleWeatherDetails() {
    const desc = document.getElementById('weather-desc');
    const weatherIconContainer = document.getElementById('weather-icon-container');
    const settingsWeatherIconContainer = document.getElementById('settings-weather-icon-container');

    const cloudySvg = `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #FF9500;">
        <g class="weather-sun">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </g>
        <path class="weather-cloud" style="fill: var(--card-bg); stroke: var(--text-main);" d="M17.5 19H9a7 7 0 1 1 6.71-5h1.79a4.5 4.5 0 1 1 0 9Z"></path>
    </svg>`;

    const rainSvg = `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #4A90E2;">
        <path class="weather-cloud" style="fill: var(--card-bg); stroke: var(--text-main);" d="M17.5 19H9a7 7 0 1 1 6.71-5h1.79a4.5 4.5 0 1 1 0 9Z"></path>
        <line class="weather-drop-1" x1="8" y1="19" x2="8" y2="21"></line>
        <line class="weather-drop-2" x1="12" y1="19" x2="12" y2="21"></line>
        <line class="weather-drop-3" x1="16" y1="19" x2="16" y2="21"></line>
    </svg>`;

    if (desc) {
        if (desc.innerText.includes('Regen') || desc.innerText.includes('Rain') || desc.innerText.includes('Sade')) {
            desc.innerText = currentLanguage === 'de' ? 'Leicht bewölkt' : (currentLanguage === 'fi' ? 'Puolipilvistä' : 'Partly cloudy');
            document.getElementById('weather-temp').innerText = '18°C';
            document.querySelector('[data-translate="widget_weather_city"]').innerText = 'Deggendorf';
            if (weatherIconContainer) weatherIconContainer.innerHTML = cloudySvg;
            if (settingsWeatherIconContainer) settingsWeatherIconContainer.innerHTML = cloudySvg;
        } else {
            desc.innerText = currentLanguage === 'de' ? 'Regen' : (currentLanguage === 'fi' ? 'Sade' : 'Rain');
            document.getElementById('weather-temp').innerText = '12°C';
            const tomorrow = currentLanguage === 'de' ? '(Morgen)' : (currentLanguage === 'fi' ? '(Huomenna)' : '(Tomorrow)');
            document.querySelector('[data-translate="widget_weather_city"]').innerText = `Deggendorf ${tomorrow}`;
            if (weatherIconContainer) weatherIconContainer.innerHTML = rainSvg;
            if (settingsWeatherIconContainer) settingsWeatherIconContainer.innerHTML = rainSvg;
        }
    }
}
