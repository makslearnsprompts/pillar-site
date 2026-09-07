/* Pillar site — the whole of the site's JavaScript.
 *
 * Two jobs: minimal analytics, and the one interaction the page needs beyond
 * CSS. Nothing here is required for the page to read or work.
 *
 * Analytics is deliberately the smallest thing that answers "did anyone open
 * the page, and did they reach for the app": a pageview, a CTA click, and an
 * FAQ open. It runs cookieless — `persistence: 'memory'` means nothing is
 * written to the visitor's browser and nobody is followed between visits, so
 * the site needs no consent banner and the Privacy Policy can keep saying that
 * this is anonymous. Do Not Track is respected. Keep §4 of privacy-policy.html
 * in step with the event names below.
 */
(function () {
  'use strict';

  // Project "Pillar" (598334) in the GLOWD org — the same project the iOS app
  // reports to. A PostHog project token is a publishable, write-only ingest
  // key: it is meant to ship in the client and cannot read anything back.
  var TOKEN = 'phc_vsznq26Gx4HXZkF7BmJKbDeePB3kWdCXDQCSQqC724tz';
  var HOST = 'https://us.i.posthog.com';

  function boot() {
    if (!window.posthog || !window.posthog.init) return;
    window.posthog.init(TOKEN, {
      api_host: HOST,
      // No cookies, no localStorage, no cross-visit identity.
      persistence: 'memory',
      person_profiles: 'never',
      respect_dnt: true,
      autocapture: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_pageview: false,
      // Nothing on this site reads a flag or shows a survey, so neither
      // request is made.
      disable_surveys: true,
      advanced_disable_feature_flags: true,
      loaded: function (ph) {
        ph.capture('site_page_viewed', {
          page: location.pathname,
          referrer_host: referrerHost()
        });
      }
    });
  }

  function referrerHost() {
    try {
      if (!document.referrer) return 'direct';
      var h = new URL(document.referrer).hostname;
      return h === location.hostname ? 'internal' : h;
    } catch (e) {
      return 'unknown';
    }
  }

  function capture(name, props) {
    if (window.posthog && window.posthog.capture) window.posthog.capture(name, props);
  }

  /* The standard PostHog array stub: queues calls until the real library
     lands, so nothing is lost if a click beats the network. */
  (function (t, e) {
    var o, n, p, r;
    e.__SV || ((window.posthog = e), (e._i = []),
      (e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split('.');
          2 == o.length && ((t = t[o[0]]), (e = o[1]));
          t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
        }
        ((p = t.createElement('script')).type = 'text/javascript');
        p.crossOrigin = 'anonymous';
        p.async = !0;
        p.src = HOST + '/static/array.js';
        (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
        var u = e;
        for (void 0 !== a ? (u = e[a] = []) : (a = 'posthog'), u.people = u.people || [],
          u.toString = function (t) {
            var e = 'posthog';
            return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e;
          }, u.people.toString = function () { return u.toString(1) + '.people (stub)'; },
          o = 'init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug'.split(' '), n = 0; n < o.length; n++) g(u, o[n]);
        e._i.push([i, s, a]);
      }), (e.__SV = 1));
  })(document, window.posthog || []);

  boot();

  /* Every route to the App Store reports where on the page it was tapped, so
     the hero, the mid-page strip, the close and the mobile dock can be told
     apart. `data-cta` names the slot. */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-cta]');
    if (!el) return;
    capture('site_cta_clicked', {
      slot: el.getAttribute('data-cta'),
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 80)
    });
  });

  document.querySelectorAll('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      var q = d.querySelector('summary');
      capture('site_faq_opened', { question: q ? q.textContent.trim().slice(0, 120) : '' });
    });
  });

  /* The one authored interaction: the flower in the nudge panel slumps as that
     section arrives and straightens when it leaves — the same lean the rig
     animates in the app when a nudge fires and when you answer it. Everything
     else that moves is either the rig's own idle or scroll-linked CSS, so there
     is no scroll listener here. */
  var nudge = document.querySelector('.ui__sky--dusk .mascot');
  if (nudge && window.PillarMascot && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var m = window.PillarMascot.get(e.target);
        if (!m) return;
        if (e.isIntersecting) m.setPose(0.92, -0.45);
        else m.setPose(0, 0.6);
      });
    }, { threshold: 0.5 }).observe(nudge);
  }
})();
