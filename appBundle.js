/**
 * App version: 1.0.0
 * SDK version: 3.0.0
 * CLI version: 2.0.2
 *
 * Generated: Thu, 22 Oct 2020 21:11:42 GMT
 */

var APP_tv_freewheel = (function () {
  'use strict';

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const settings = {};
  const subscribers = {};

  const initSettings = (appSettings, platformSettings) => {
    settings['app'] = appSettings;
    settings['platform'] = platformSettings;
    settings['user'] = {};
  };

  const publish = (key, value) => {
    subscribers[key] && subscribers[key].forEach(subscriber => subscriber(value));
  };

  const dotGrab = (obj = {}, key) => {
    const keys = key.split('.');
    for (let i = 0; i < keys.length; i++) {
      obj = obj[keys[i]] = obj[keys[i]] !== undefined ? obj[keys[i]] : {};
    }
    return typeof obj === 'object' ? (Object.keys(obj).length ? obj : undefined) : obj
  };

  var Settings = {
    get(type, key, fallback = undefined) {
      const val = dotGrab(settings[type], key);
      return val !== undefined ? val : fallback
    },
    has(type, key) {
      return !!this.get(type, key)
    },
    set(key, value) {
      settings['user'][key] = value;
      publish(key, value);
    },
    subscribe(key, callback) {
      subscribers[key] = subscribers[key] || [];
      subscribers[key].push(callback);
    },
    unsubscribe(key, callback) {
      if (callback) {
        const index = subscribers[key] && subscribers[key].findIndex(cb => cb === callback);
        index > -1 && subscribers[key].splice(index, 1);
      } else {
        if (key in subscribers) {
          subscribers[key] = [];
        }
      }
    },
    clearSubscribers() {
      for (const key of Object.getOwnPropertyNames(subscribers)) {
        delete subscribers[key];
      }
    },
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const prepLog = (type, args) => {
    const colors = {
      Info: 'green',
      Debug: 'gray',
      Warn: 'orange',
      Error: 'red',
    };

    args = Array.from(args);
    return [
      '%c' + (args.length > 1 && typeof args[0] === 'string' ? args.shift() : type),
      'background-color: ' + colors[type] + '; color: white; padding: 2px 4px; border-radius: 2px',
      args,
    ]
  };

  var Log = {
    info() {
      Settings.get('platform', 'log') && console.log.apply(console, prepLog('Info', arguments));
    },
    debug() {
      Settings.get('platform', 'log') && console.debug.apply(console, prepLog('Debug', arguments));
    },
    error() {
      Settings.get('platform', 'log') && console.error.apply(console, prepLog('Error', arguments));
    },
    warn() {
      Settings.get('platform', 'log') && console.warn.apply(console, prepLog('Warn', arguments));
    },
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let sendMetric = (type, event, params) => {
    Log.info('Sending metric', type, event, params);
  };

  const initMetrics = config => {
    sendMetric = config.sendMetric;
  };

  // available metric per category
  const metrics = {
    app: ['launch', 'loaded', 'ready', 'close'],
    page: ['view', 'leave'],
    user: ['click', 'input'],
    media: [
      'abort',
      'canplay',
      'ended',
      'pause',
      'play',
      // with some videos there occur almost constant suspend events ... should investigate
      // 'suspend',
      'volumechange',
      'waiting',
      'seeking',
      'seeked',
    ],
  };

  // error metric function (added to each category)
  const errorMetric = (type, message, code, visible, params = {}) => {
    params = { params, ...{ message, code, visible } };
    sendMetric(type, 'error', params);
  };

  const Metric = (type, events, options = {}) => {
    return events.reduce(
      (obj, event) => {
        obj[event] = (name, params = {}) => {
          params = { ...options, ...(name ? { name } : {}), ...params };
          sendMetric(type, event, params);
        };
        return obj
      },
      {
        error(message, code, params) {
          errorMetric(type, message, code, params);
        },
        event(name, params) {
          sendMetric(type, name, params);
        },
      }
    )
  };

  const Metrics = types => {
    return Object.keys(types).reduce(
      (obj, type) => {
        // media metric works a bit different!
        // it's a function that accepts a url and returns an object with the available metrics
        // url is automatically passed as a param in every metric
        type === 'media'
          ? (obj[type] = url => Metric(type, types[type], { url }))
          : (obj[type] = Metric(type, types[type]));
        return obj
      },
      { error: errorMetric, event: sendMetric }
    )
  };

  var Metrics$1 = Metrics(metrics);

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  var events = {
    abort: 'Abort',
    canplay: 'CanPlay',
    canplaythrough: 'CanPlayThrough',
    durationchange: 'DurationChange',
    emptied: 'Emptied',
    encrypted: 'Encrypted',
    ended: 'Ended',
    error: 'Error',
    interruptbegin: 'InterruptBegin',
    interruptend: 'InterruptEnd',
    loadeddata: 'LoadedData',
    loadedmetadata: 'LoadedMetadata',
    loadstart: 'LoadStart',
    pause: 'Pause',
    play: 'Play',
    playing: 'Playing',
    progress: 'Progress',
    ratechange: 'Ratechange',
    seeked: 'Seeked',
    seeking: 'Seeking',
    stalled: 'Stalled',
    // suspend: 'Suspend', // this one is called a looooot for some videos
    timeupdate: 'TimeUpdate',
    volumechange: 'VolumeChange',
    waiting: 'Waiting',
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  var autoSetupMixin = (sourceObject, setup = () => {}) => {
    let ready = false;

    const doSetup = () => {
      if (ready === false) {
        setup();
        ready = true;
      }
    };

    return Object.keys(sourceObject).reduce((obj, key) => {
      if (typeof sourceObject[key] === 'function') {
        obj[key] = function() {
          doSetup();
          return sourceObject[key].apply(sourceObject, arguments)
        };
      } else if (typeof Object.getOwnPropertyDescriptor(sourceObject, key).get === 'function') {
        obj.__defineGetter__(key, function() {
          doSetup();
          return Object.getOwnPropertyDescriptor(sourceObject, key).get.apply(sourceObject)
        });
      } else if (typeof Object.getOwnPropertyDescriptor(sourceObject, key).set === 'function') {
        obj.__defineSetter__(key, function() {
          doSetup();
          return Object.getOwnPropertyDescriptor(sourceObject, key).set.sourceObject[key].apply(
            sourceObject,
            arguments
          )
        });
      } else {
        obj[key] = sourceObject[key];
      }
      return obj
    }, {})
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let timeout = null;

  var easeExecution = (cb, delay) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb();
    }, delay);
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let basePath;
  let proxyUrl;

  const initUtils = config => {
    basePath = ensureUrlWithProtocol(makeFullStaticPath(window.location.pathname, config.path || '/'));

    if (config.proxyUrl) {
      proxyUrl = ensureUrlWithProtocol(config.proxyUrl);
    }
  };

  var Utils = {
    asset(relPath) {
      return basePath + relPath
    },
    proxyUrl(url, options = {}) {
      return proxyUrl ? proxyUrl + '?' + makeQueryString(url, options) : url
    },
    makeQueryString() {
      return makeQueryString(...arguments)
    },
    // since imageworkers don't work without protocol
    ensureUrlWithProtocol() {
      return ensureUrlWithProtocol(...arguments)
    },
  };

  const ensureUrlWithProtocol = url => {
    if (/^\/\//.test(url)) {
      return window.location.protocol + url
    }
    if (!/^(?:https?:)/i.test(url)) {
      return window.location.origin + url
    }
    return url
  };

  const makeFullStaticPath = (pathname = '/', path) => {
    // ensure path has traling slash
    path = path.charAt(path.length - 1) !== '/' ? path + '/' : path;

    // if path is URL, we assume it's already the full static path, so we just return it
    if (/^(?:https?:)?(?:\/\/)/.test(path)) {
      return path
    }

    if (path.charAt(0) === '/') {
      return path
    } else {
      // cleanup the pathname (i.e. remove possible index.html)
      pathname = cleanUpPathName(pathname);

      // remove possible leading dot from path
      path = path.charAt(0) === '.' ? path.substr(1) : path;
      // ensure path has leading slash
      path = path.charAt(0) !== '/' ? '/' + path : path;
      return pathname + path
    }
  };

  const cleanUpPathName = pathname => {
    if (pathname.slice(-1) === '/') return pathname.slice(0, -1)
    const parts = pathname.split('/');
    if (parts[parts.length - 1].indexOf('.') > -1) parts.pop();
    return parts.join('/')
  };

  const makeQueryString = (url, options = {}, type = 'url') => {
    // add operator as an option
    options.operator = 'metrological'; // Todo: make this configurable (via url?)
    // add type (= url or qr) as an option, with url as the value
    options[type] = url;

    return Object.keys(options)
      .map(key => {
        return encodeURIComponent(key) + '=' + encodeURIComponent('' + options[key])
      })
      .join('&')
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const formatLocale = locale => {
    if (locale && locale.length === 2) {
      return `${locale.toLowerCase()}-${locale.toUpperCase()}`
    } else {
      return locale
    }
  };

  const getLocale = defaultValue => {
    if ('language' in navigator) {
      const locale = formatLocale(navigator.language);
      return Promise.resolve(locale)
    } else {
      return Promise.resolve(defaultValue)
    }
  };

  const getLanguage = defaultValue => {
    if ('language' in navigator) {
      const language = formatLocale(navigator.language).slice(0, 2);
      return Promise.resolve(language)
    } else {
      return Promise.resolve(defaultValue)
    }
  };

  const getCountryCode = defaultValue => {
    if ('language' in navigator) {
      const countryCode = formatLocale(navigator.language).slice(3, 5);
      return Promise.resolve(countryCode)
    } else {
      return Promise.resolve(defaultValue)
    }
  };

  const hasOrAskForGeoLocationPermission = () => {
    return new Promise(resolve => {
      // force to prompt for location permission
      if (Settings.get('platform', 'forceBrowserGeolocation') === true) resolve(true);
      if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
          resolve(status.state === 'granted' || status.status === 'granted');
        });
      } else {
        resolve(false);
      }
    })
  };

  const getLatLon = defaultValue => {
    return new Promise(resolve => {
      hasOrAskForGeoLocationPermission().then(granted => {
        if (granted === true) {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              // success
              result =>
                result && result.coords && resolve([result.coords.latitude, result.coords.longitude]),
              // error
              () => resolve(defaultValue),
              // options
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              }
            );
          } else {
            return queryForLatLon().then(result => resolve(result || defaultValue))
          }
        } else {
          return queryForLatLon().then(result => resolve(result || defaultValue))
        }
      });
    })
  };

  const queryForLatLon = () => {
    return new Promise(resolve => {
      fetch('https://geolocation-db.com/json/')
        .then(response => response.json())
        .then(({ latitude, longitude }) =>
          latitude && longitude ? resolve([latitude, longitude]) : resolve(false)
        )
        .catch(() => resolve(false));
    })
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const defaultProfile = {
    ageRating: 'adult',
    city: 'New York',
    zipCode: '27505',
    countryCode: () => getCountryCode('US'),
    ip: '127.0.0.1',
    household: 'b2244e9d4c04826ccd5a7b2c2a50e7d4',
    language: () => getLanguage('en'),
    latlon: () => getLatLon([40.7128, 74.006]),
    locale: () => getLocale('en-US'),
    mac: '00:00:00:00:00:00',
    operator: 'Metrological',
    platform: 'Metrological',
    packages: [],
    uid: 'ee6723b8-7ab3-462c-8d93-dbf61227998e',
    stbType: 'Metrological',
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let getInfo = key => {
    const profile = { ...defaultProfile, ...Settings.get('platform', 'profile') };
    return Promise.resolve(typeof profile[key] === 'function' ? profile[key]() : profile[key])
  };

  let setInfo = (key, params) => {
    if (key in defaultProfile) defaultProfile[key] = params;
  };

  const initProfile = config => {
    getInfo = config.getInfo;
    setInfo = config.setInfo;
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  var Lightning = window.lng;

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const events$1 = [
    'timeupdate',
    'error',
    'ended',
    'loadeddata',
    'canplay',
    'play',
    'playing',
    'pause',
    'loadstart',
    'seeking',
    'seeked',
    'encrypted',
  ];

  let mediaUrl = url => url;

  const initMediaPlayer = config => {
    if (config.mediaUrl) {
      mediaUrl = config.mediaUrl;
    }
  };

  class Mediaplayer extends Lightning.Component {
    _construct() {
      this._skipRenderToTexture = false;
      this._metrics = null;
      this._textureMode = Settings.get('platform', 'textureMode') || false;
      Log.info('Texture mode: ' + this._textureMode);
    }

    static _template() {
      return {
        Video: {
          VideoWrap: {
            VideoTexture: {
              visible: false,
              pivot: 0.5,
              texture: { type: Lightning.textures.StaticTexture, options: {} },
            },
          },
        },
      }
    }

    set skipRenderToTexture(v) {
      this._skipRenderToTexture = v;
    }

    get textureMode() {
      return this._textureMode
    }

    get videoView() {
      return this.tag('Video')
    }

    _init() {
      //re-use videotag if already there
      const videoEls = document.getElementsByTagName('video');
      if (videoEls && videoEls.length > 0) this.videoEl = videoEls[0];
      else {
        this.videoEl = document.createElement('video');
        this.videoEl.setAttribute('id', 'video-player');
        this.videoEl.style.position = 'absolute';
        this.videoEl.style.zIndex = '1';
        this.videoEl.style.display = 'none';
        this.videoEl.setAttribute('width', '100%');
        this.videoEl.setAttribute('height', '100%');

        this.videoEl.style.visibility = this.textureMode ? 'hidden' : 'visible';
        document.body.appendChild(this.videoEl);
      }
      if (this.textureMode && !this._skipRenderToTexture) {
        this._createVideoTexture();
      }

      this.eventHandlers = [];
    }

    _registerListeners() {
      events$1.forEach(event => {
        const handler = e => {
          if (this._metrics && this._metrics[event] && typeof this._metrics[event] === 'function') {
            this._metrics[event]({ currentTime: this.videoEl.currentTime });
          }
          this.fire(event, { videoElement: this.videoEl, event: e });
        };
        this.eventHandlers.push(handler);
        this.videoEl.addEventListener(event, handler);
      });
    }

    _deregisterListeners() {
      Log.info('Deregistering event listeners MediaPlayer');
      events$1.forEach((event, index) => {
        this.videoEl.removeEventListener(event, this.eventHandlers[index]);
      });
      this.eventHandlers = [];
    }

    _attach() {
      this._registerListeners();
    }

    _detach() {
      this._deregisterListeners();
      this.close();
    }

    _createVideoTexture() {
      const stage = this.stage;

      const gl = stage.gl;
      const glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.videoTexture.options = { source: glTexture, w: this.videoEl.width, h: this.videoEl.height };
    }

    _startUpdatingVideoTexture() {
      if (this.textureMode && !this._skipRenderToTexture) {
        const stage = this.stage;
        if (!this._updateVideoTexture) {
          this._updateVideoTexture = () => {
            if (this.videoTexture.options.source && this.videoEl.videoWidth && this.active) {
              const gl = stage.gl;

              const currentTime = new Date().getTime();

              // When BR2_PACKAGE_GST1_PLUGINS_BAD_PLUGIN_DEBUGUTILS is not set in WPE, webkitDecodedFrameCount will not be available.
              // We'll fallback to fixed 30fps in this case.
              const frameCount = this.videoEl.webkitDecodedFrameCount;

              const mustUpdate = frameCount
                ? this._lastFrame !== frameCount
                : this._lastTime < currentTime - 30;

              if (mustUpdate) {
                this._lastTime = currentTime;
                this._lastFrame = frameCount;
                try {
                  gl.bindTexture(gl.TEXTURE_2D, this.videoTexture.options.source);
                  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoEl);
                  this._lastFrame = this.videoEl.webkitDecodedFrameCount;
                  this.videoTextureView.visible = true;

                  this.videoTexture.options.w = this.videoEl.videoWidth;
                  this.videoTexture.options.h = this.videoEl.videoHeight;
                  const expectedAspectRatio = this.videoTextureView.w / this.videoTextureView.h;
                  const realAspectRatio = this.videoEl.videoWidth / this.videoEl.videoHeight;
                  if (expectedAspectRatio > realAspectRatio) {
                    this.videoTextureView.scaleX = realAspectRatio / expectedAspectRatio;
                    this.videoTextureView.scaleY = 1;
                  } else {
                    this.videoTextureView.scaleY = expectedAspectRatio / realAspectRatio;
                    this.videoTextureView.scaleX = 1;
                  }
                } catch (e) {
                  Log.error('texImage2d video', e);
                  this._stopUpdatingVideoTexture();
                  this.videoTextureView.visible = false;
                }
                this.videoTexture.source.forceRenderUpdate();
              }
            }
          };
        }
        if (!this._updatingVideoTexture) {
          stage.on('frameStart', this._updateVideoTexture);
          this._updatingVideoTexture = true;
        }
      }
    }

    _stopUpdatingVideoTexture() {
      if (this.textureMode) {
        const stage = this.stage;
        stage.removeListener('frameStart', this._updateVideoTexture);
        this._updatingVideoTexture = false;
        this.videoTextureView.visible = false;

        if (this.videoTexture.options.source) {
          const gl = stage.gl;
          gl.bindTexture(gl.TEXTURE_2D, this.videoTexture.options.source);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
      }
    }

    updateSettings(settings = {}) {
      // The Component that 'consumes' the media player.
      this._consumer = settings.consumer;

      if (this._consumer && this._consumer.getMediaplayerSettings) {
        // Allow consumer to add settings.
        settings = Object.assign(settings, this._consumer.getMediaplayerSettings());
      }

      if (!Lightning.Utils.equalValues(this._stream, settings.stream)) {
        if (settings.stream && settings.stream.keySystem) {
          navigator
            .requestMediaKeySystemAccess(
              settings.stream.keySystem.id,
              settings.stream.keySystem.config
            )
            .then(keySystemAccess => {
              return keySystemAccess.createMediaKeys()
            })
            .then(createdMediaKeys => {
              return this.videoEl.setMediaKeys(createdMediaKeys)
            })
            .then(() => {
              if (settings.stream && settings.stream.src) this.open(settings.stream.src);
            })
            .catch(() => {
              console.error('Failed to set up MediaKeys');
            });
        } else if (settings.stream && settings.stream.src) {
          // This is here to be backwards compatible, will be removed
          // in future sdk release
          if (Settings.get('app', 'hls')) {
            if (!window.Hls) {
              window.Hls = class Hls {
                static isSupported() {
                  console.warn('hls-light not included');
                  return false
                }
              };
            }
            if (window.Hls.isSupported()) {
              if (!this._hls) this._hls = new window.Hls({ liveDurationInfinity: true });
              this._hls.loadSource(settings.stream.src);
              this._hls.attachMedia(this.videoEl);
              this.videoEl.style.display = 'block';
            }
          } else {
            this.open(settings.stream.src);
          }
        } else {
          this.close();
        }
        this._stream = settings.stream;
      }

      this._setHide(settings.hide);
      this._setVideoArea(settings.videoPos);
    }

    _setHide(hide) {
      if (this.textureMode) {
        this.tag('Video').setSmooth('alpha', hide ? 0 : 1);
      } else {
        this.videoEl.style.visibility = hide ? 'hidden' : 'visible';
      }
    }

    open(url, settings = { hide: false, videoPosition: null }) {
      // prep the media url to play depending on platform (mediaPlayerplugin)
      url = mediaUrl(url);
      this._metrics = Metrics$1.media(url);
      Log.info('Playing stream', url);
      if (this.application.noVideo) {
        Log.info('noVideo option set, so ignoring: ' + url);
        return
      }
      // close the video when opening same url as current (effectively reloading)
      if (this.videoEl.getAttribute('src') === url) {
        this.close();
      }
      this.videoEl.setAttribute('src', url);

      // force hide, then force show (in next tick!)
      // (fixes comcast playback rollover issue)
      this.videoEl.style.visibility = 'hidden';
      this.videoEl.style.display = 'none';

      setTimeout(() => {
        this.videoEl.style.display = 'block';
        this.videoEl.style.visibility = 'visible';
      });

      this._setHide(settings.hide);
      this._setVideoArea(settings.videoPosition || [0, 0, 1920, 1080]);
    }

    close() {
      // We need to pause first in order to stop sound.
      this.videoEl.pause();
      this.videoEl.removeAttribute('src');

      // force load to reset everything without errors
      this.videoEl.load();

      this._clearSrc();

      this.videoEl.style.display = 'none';
    }

    playPause() {
      if (this.isPlaying()) {
        this.doPause();
      } else {
        this.doPlay();
      }
    }

    get muted() {
      return this.videoEl.muted
    }

    set muted(v) {
      this.videoEl.muted = v;
    }

    get loop() {
      return this.videoEl.loop
    }

    set loop(v) {
      this.videoEl.loop = v;
    }

    isPlaying() {
      return this._getState() === 'Playing'
    }

    doPlay() {
      this.videoEl.play();
    }

    doPause() {
      this.videoEl.pause();
    }

    reload() {
      var url = this.videoEl.getAttribute('src');
      this.close();
      this.videoEl.src = url;
    }

    getPosition() {
      return Promise.resolve(this.videoEl.currentTime)
    }

    setPosition(pos) {
      this.videoEl.currentTime = pos;
    }

    getDuration() {
      return Promise.resolve(this.videoEl.duration)
    }

    seek(time, absolute = false) {
      if (absolute) {
        this.videoEl.currentTime = time;
      } else {
        this.videoEl.currentTime += time;
      }
    }

    get videoTextureView() {
      return this.tag('Video').tag('VideoTexture')
    }

    get videoTexture() {
      return this.videoTextureView.texture
    }

    _setVideoArea(videoPos) {
      if (Lightning.Utils.equalValues(this._videoPos, videoPos)) {
        return
      }

      this._videoPos = videoPos;

      if (this.textureMode) {
        this.videoTextureView.patch({
          smooth: {
            x: videoPos[0],
            y: videoPos[1],
            w: videoPos[2] - videoPos[0],
            h: videoPos[3] - videoPos[1],
          },
        });
      } else {
        const precision = this.stage.getRenderPrecision();
        this.videoEl.style.left = Math.round(videoPos[0] * precision) + 'px';
        this.videoEl.style.top = Math.round(videoPos[1] * precision) + 'px';
        this.videoEl.style.width = Math.round((videoPos[2] - videoPos[0]) * precision) + 'px';
        this.videoEl.style.height = Math.round((videoPos[3] - videoPos[1]) * precision) + 'px';
      }
    }

    _fireConsumer(event, args) {
      if (this._consumer) {
        this._consumer.fire(event, args);
      }
    }

    _equalInitData(buf1, buf2) {
      if (!buf1 || !buf2) return false
      if (buf1.byteLength != buf2.byteLength) return false
      const dv1 = new Int8Array(buf1);
      const dv2 = new Int8Array(buf2);
      for (let i = 0; i != buf1.byteLength; i++) if (dv1[i] != dv2[i]) return false
      return true
    }

    error(args) {
      this._fireConsumer('$mediaplayerError', args);
      this._setState('');
      return ''
    }

    loadeddata(args) {
      this._fireConsumer('$mediaplayerLoadedData', args);
    }

    play(args) {
      this._fireConsumer('$mediaplayerPlay', args);
    }

    playing(args) {
      this._fireConsumer('$mediaplayerPlaying', args);
      this._setState('Playing');
    }

    canplay(args) {
      this.videoEl.play();
      this._fireConsumer('$mediaplayerStart', args);
    }

    loadstart(args) {
      this._fireConsumer('$mediaplayerLoad', args);
    }

    seeked() {
      this._fireConsumer('$mediaplayerSeeked', {
        currentTime: this.videoEl.currentTime,
        duration: this.videoEl.duration || 1,
      });
    }

    seeking() {
      this._fireConsumer('$mediaplayerSeeking', {
        currentTime: this.videoEl.currentTime,
        duration: this.videoEl.duration || 1,
      });
    }

    durationchange(args) {
      this._fireConsumer('$mediaplayerDurationChange', args);
    }

    encrypted(args) {
      const video = args.videoElement;
      const event = args.event;
      // FIXME: Double encrypted events need to be properly filtered by Gstreamer
      if (video.mediaKeys && !this._equalInitData(this._previousInitData, event.initData)) {
        this._previousInitData = event.initData;
        this._fireConsumer('$mediaplayerEncrypted', args);
      }
    }

    static _states() {
      return [
        class Playing extends this {
          $enter() {
            this._startUpdatingVideoTexture();
          }
          $exit() {
            this._stopUpdatingVideoTexture();
          }
          timeupdate() {
            this._fireConsumer('$mediaplayerProgress', {
              currentTime: this.videoEl.currentTime,
              duration: this.videoEl.duration || 1,
            });
          }
          ended(args) {
            this._fireConsumer('$mediaplayerEnded', args);
            this._setState('');
          }
          pause(args) {
            this._fireConsumer('$mediaplayerPause', args);
            this._setState('Playing.Paused');
          }
          _clearSrc() {
            this._fireConsumer('$mediaplayerStop', {});
            this._setState('');
          }
          static _states() {
            return [class Paused extends this {}]
          }
        },
      ]
    }
  }

  class localCookie{constructor(e){return e=e||{},this.forceCookies=e.forceCookies||!1,!0===this._checkIfLocalStorageWorks()&&!0!==e.forceCookies?{getItem:this._getItemLocalStorage,setItem:this._setItemLocalStorage,removeItem:this._removeItemLocalStorage,clear:this._clearLocalStorage}:{getItem:this._getItemCookie,setItem:this._setItemCookie,removeItem:this._removeItemCookie,clear:this._clearCookies}}_checkIfLocalStorageWorks(){if("undefined"==typeof localStorage)return !1;try{return localStorage.setItem("feature_test","yes"),"yes"===localStorage.getItem("feature_test")&&(localStorage.removeItem("feature_test"),!0)}catch(e){return !1}}_getItemLocalStorage(e){return window.localStorage.getItem(e)}_setItemLocalStorage(e,t){return window.localStorage.setItem(e,t)}_removeItemLocalStorage(e){return window.localStorage.removeItem(e)}_clearLocalStorage(){return window.localStorage.clear()}_getItemCookie(e){var t=document.cookie.match(RegExp("(?:^|;\\s*)"+function(e){return e.replace(/([.*+?\^${}()|\[\]\/\\])/g,"\\$1")}(e)+"=([^;]*)"));return t&&""===t[1]&&(t[1]=null),t?t[1]:null}_setItemCookie(e,t){document.cookie=`${e}=${t}`;}_removeItemCookie(e){document.cookie=`${e}=;Max-Age=-99999999;`;}_clearCookies(){document.cookie.split(";").forEach(e=>{document.cookie=e.replace(/^ +/,"").replace(/=.*/,"=;expires=Max-Age=-99999999");});}}

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let namespace;
  let lc;

  const initStorage = () => {
    namespace = Settings.get('platform', 'appId');
    // todo: pass options (for example to force the use of cookies)
    lc = new localCookie();
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const isFunction = v => {
    return typeof v === 'function'
  };

  const isObject = v => {
    return typeof v === 'object' && v !== null
  };

  const isBoolean = v => {
    return typeof v === 'boolean'
  };

  const isPage = v => {
    if (v instanceof Lightning.Element || isComponentConstructor(v)) {
      return true
    }
    return false
  };

  const isComponentConstructor = type => {
    return type.prototype && 'isComponent' in type.prototype
  };

  const isArray = v => {
    return Array.isArray(v)
  };

  const ucfirst = v => {
    return `${v.charAt(0).toUpperCase()}${v.slice(1)}`
  };

  const isString = v => {
    return typeof v === 'string'
  };

  const isPromise = (method, args) => {
    let result;
    if (isFunction(method)) {
      try {
        result = method.apply(null);
      } catch (e) {
        result = e;
      }
    } else {
      result = method;
    }
    return isObject(result) && isFunction(result.then)
  };

  const incorrectParams = (cb, route) => {
    const isIncorrect = /^\w*?\s?\(\s?\{.*?\}\s?\)/i;
    if (isIncorrect.test(cb.toString())) {
      console.warn(
        [
          `DEPRECATION: The data-provider for route: ${route} is not correct.`,
          '"page" is no longer a property of the params object but is now the first function parameter: ',
          'https://github.com/rdkcentral/Lightning-SDK/blob/feature/router/docs/plugins/router/dataproviding.md#data-providing',
          "It's supported for now but will be removed in a future release.",
        ].join('\n')
      );
      return true
    }
    return false
  };

  const symbols = {
    route: Symbol('route'),
    hash: Symbol('hash'),
    store: Symbol('store'),
    fromHistory: Symbol('fromHistory'),
    expires: Symbol('expires'),
    resume: Symbol('resume'),
    backtrack: Symbol('backtrack'),
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const fade = (i, o) => {
    return new Promise(resolve => {
      i.patch({
        alpha: 0,
        visible: true,
        smooth: {
          alpha: [1, { duration: 0.5, delay: 0.1 }],
        },
      });
      // resolve on y finish
      i.transition('alpha').on('finish', () => {
        if (o) {
          o.visible = false;
        }
        resolve();
      });
    })
  };

  const crossFade = (i, o) => {
    return new Promise(resolve => {
      i.patch({
        alpha: 0,
        visible: true,
        smooth: {
          alpha: [1, { duration: 0.5, delay: 0.1 }],
        },
      });
      if (o) {
        o.patch({
          smooth: {
            alpha: [0, { duration: 0.5, delay: 0.3 }],
          },
        });
      }
      // resolve on y finish
      i.transition('alpha').on('finish', () => {
        resolve();
      });
    })
  };

  const moveOnAxes = (axis, direction, i, o) => {
    const bounds = axis === 'x' ? 1920 : 1080;
    return new Promise(resolve => {
      i.patch({
        [`${axis}`]: direction ? bounds * -1 : bounds,
        visible: true,
        smooth: {
          [`${axis}`]: [0, { duration: 0.4, delay: 0.2 }],
        },
      });
      // out is optional
      if (o) {
        o.patch({
          [`${axis}`]: 0,
          smooth: {
            [`${axis}`]: [direction ? bounds : bounds * -1, { duration: 0.4, delay: 0.2 }],
          },
        });
      }
      // resolve on y finish
      i.transition(axis).on('finish', () => {
        resolve();
      });
    })
  };

  const up = (i, o) => {
    return moveOnAxes('y', 0, i, o)
  };

  const down = (i, o) => {
    return moveOnAxes('y', 1, i, o)
  };

  const left = (i, o) => {
    return moveOnAxes('x', 0, i, o)
  };

  const right = (i, o) => {
    return moveOnAxes('x', 1, i, o)
  };

  var Transitions = {
    fade,
    crossFade,
    up,
    down,
    left,
    right,
  };

  var isMergeableObject = function isMergeableObject(value) {
  	return isNonNullObject(value)
  		&& !isSpecial(value)
  };

  function isNonNullObject(value) {
  	return !!value && typeof value === 'object'
  }

  function isSpecial(value) {
  	var stringValue = Object.prototype.toString.call(value);

  	return stringValue === '[object RegExp]'
  		|| stringValue === '[object Date]'
  		|| isReactElement(value)
  }

  // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
  var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
  var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

  function isReactElement(value) {
  	return value.$$typeof === REACT_ELEMENT_TYPE
  }

  function emptyTarget(val) {
  	return Array.isArray(val) ? [] : {}
  }

  function cloneUnlessOtherwiseSpecified(value, options) {
  	return (options.clone !== false && options.isMergeableObject(value))
  		? deepmerge(emptyTarget(value), value, options)
  		: value
  }

  function defaultArrayMerge(target, source, options) {
  	return target.concat(source).map(function(element) {
  		return cloneUnlessOtherwiseSpecified(element, options)
  	})
  }

  function getMergeFunction(key, options) {
  	if (!options.customMerge) {
  		return deepmerge
  	}
  	var customMerge = options.customMerge(key);
  	return typeof customMerge === 'function' ? customMerge : deepmerge
  }

  function getEnumerableOwnPropertySymbols(target) {
  	return Object.getOwnPropertySymbols
  		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
  			return target.propertyIsEnumerable(symbol)
  		})
  		: []
  }

  function getKeys(target) {
  	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
  }

  function propertyIsOnObject(object, property) {
  	try {
  		return property in object
  	} catch(_) {
  		return false
  	}
  }

  // Protects from prototype poisoning and unexpected merging up the prototype chain.
  function propertyIsUnsafe(target, key) {
  	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
  		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
  			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
  }

  function mergeObject(target, source, options) {
  	var destination = {};
  	if (options.isMergeableObject(target)) {
  		getKeys(target).forEach(function(key) {
  			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
  		});
  	}
  	getKeys(source).forEach(function(key) {
  		if (propertyIsUnsafe(target, key)) {
  			return
  		}

  		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
  			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
  		} else {
  			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
  		}
  	});
  	return destination
  }

  function deepmerge(target, source, options) {
  	options = options || {};
  	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
  	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
  	// implementations can use it. The caller may not replace it.
  	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

  	var sourceIsArray = Array.isArray(source);
  	var targetIsArray = Array.isArray(target);
  	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

  	if (!sourceAndTargetTypesMatch) {
  		return cloneUnlessOtherwiseSpecified(source, options)
  	} else if (sourceIsArray) {
  		return options.arrayMerge(target, source, options)
  	} else {
  		return mergeObject(target, source, options)
  	}
  }

  deepmerge.all = function deepmergeAll(array, options) {
  	if (!Array.isArray(array)) {
  		throw new Error('first argument should be an array')
  	}

  	return array.reduce(function(prev, next) {
  		return deepmerge(prev, next, options)
  	}, {})
  };

  var deepmerge_1 = deepmerge;

  var cjs = deepmerge_1;

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let warned = false;
  const deprecated = (force = false) => {
    if (force === true || warned === false) {
      console.warn(
        "The 'Locale'-plugin in the Lightning-SDK is deprecated and will be removed in future releases. \n\n Please consider using the new 'Language'-plugin instead."
      );
    }
    warned = true;
  };
  class Locale {
    constructor() {
      this.__enabled = false;
    }

    /**
     * Loads translation object from external json file.
     *
     * @param {String} path Path to resource.
     * @return {Promise}
     */
    async load(path) {
      if (!this.__enabled) {
        return
      }

      await fetch(path)
        .then(resp => resp.json())
        .then(resp => {
          this.loadFromObject(resp);
        });
    }

    /**
     * Sets language used by module.
     *
     * @param {String} lang
     */
    setLanguage(lang) {
      deprecated();
      this.__enabled = true;
      this.language = lang;
    }

    /**
     * Returns reference to translation object for current language.
     *
     * @return {Object}
     */
    get tr() {
      deprecated(true);
      return this.__trObj[this.language]
    }

    /**
     * Loads translation object from existing object (binds existing object).
     *
     * @param {Object} trObj
     */
    loadFromObject(trObj) {
      deprecated();
      const fallbackLanguage = 'en';
      if (Object.keys(trObj).indexOf(this.language) === -1) {
        Log.warn('No translations found for: ' + this.language);
        if (Object.keys(trObj).indexOf(fallbackLanguage) > -1) {
          Log.warn('Using fallback language: ' + fallbackLanguage);
          this.language = fallbackLanguage;
        } else {
          const error = 'No translations found for fallback language: ' + fallbackLanguage;
          Log.error(error);
          throw Error(error)
        }
      }

      this.__trObj = trObj;
      for (const lang of Object.values(this.__trObj)) {
        for (const str of Object.keys(lang)) {
          lang[str] = new LocalizedString(lang[str]);
        }
      }
    }
  }

  /**
   * Extended string class used for localization.
   */
  class LocalizedString extends String {
    /**
     * Returns formatted LocalizedString.
     * Replaces each placeholder value (e.g. {0}, {1}) with corresponding argument.
     *
     * E.g.:
     * > new LocalizedString('{0} and {1} and {0}').format('A', 'B');
     * A and B and A
     *
     * @param  {...any} args List of arguments for placeholders.
     */
    format(...args) {
      const sub = args.reduce((string, arg, index) => string.split(`{${index}}`).join(arg), this);
      return new LocalizedString(sub)
    }
  }

  var Locale$1 = new Locale();

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  class VersionLabel extends Lightning.Component {
    static _template() {
      return {
        rect: true,
        color: 0xbb0078ac,
        h: 40,
        w: 100,
        x: w => w - 50,
        y: h => h - 50,
        mount: 1,
        Text: {
          w: w => w,
          h: h => h,
          y: 5,
          x: 20,
          text: {
            fontSize: 22,
            lineHeight: 26,
          },
        },
      }
    }

    _firstActive() {
      this.tag('Text').text = `APP - v${this.version}\nSDK - v${this.sdkVersion}`;
      this.tag('Text').loadTexture();
      this.w = this.tag('Text').renderWidth + 40;
      this.h = this.tag('Text').renderHeight + 5;
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  class FpsIndicator extends Lightning.Component {
    static _template() {
      return {
        rect: true,
        color: 0xffffffff,
        texture: Lightning.Tools.getRoundRect(80, 80, 40),
        h: 80,
        w: 80,
        x: 100,
        y: 100,
        mount: 1,
        Background: {
          x: 3,
          y: 3,
          texture: Lightning.Tools.getRoundRect(72, 72, 36),
          color: 0xff008000,
        },
        Counter: {
          w: w => w,
          h: h => h,
          y: 10,
          text: {
            fontSize: 32,
            textAlign: 'center',
          },
        },
        Text: {
          w: w => w,
          h: h => h,
          y: 48,
          text: {
            fontSize: 15,
            textAlign: 'center',
            text: 'FPS',
          },
        },
      }
    }

    _setup() {
      this.config = {
        ...{
          log: false,
          interval: 500,
          threshold: 1,
        },
        ...Settings.get('platform', 'showFps'),
      };

      this.fps = 0;
      this.lastFps = this.fps - this.config.threshold;

      const fpsCalculator = () => {
        this.fps = ~~(1 / this.stage.dt);
      };
      this.stage.on('frameStart', fpsCalculator);
      this.stage.off('framestart', fpsCalculator);
      this.interval = setInterval(this.showFps.bind(this), this.config.interval);
    }

    _firstActive() {
      this.showFps();
    }

    _detach() {
      clearInterval(this.interval);
    }

    showFps() {
      if (Math.abs(this.lastFps - this.fps) <= this.config.threshold) return
      this.lastFps = this.fps;
      // green
      let bgColor = 0xff008000;
      // orange
      if (this.fps <= 40 && this.fps > 20) bgColor = 0xffffa500;
      // red
      else if (this.fps <= 20) bgColor = 0xffff0000;

      this.tag('Background').setSmooth('color', bgColor);
      this.tag('Counter').text = `${this.fps}`;

      this.config.log && Log.info('FPS', this.fps);
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let meta = {};
  let translations = {};
  let language = null;

  const initLanguage = (file, language = null) => {
    return new Promise((resolve, reject) => {
      fetch(file)
        .then(response => response.json())
        .then(json => {
          setTranslations(json);
          // set language (directly or in a promise)
          typeof language === 'object' && 'then' in language && typeof language.then === 'function'
            ? language
                .then(lang =>
                  setLanguage(lang)
                    .then(resolve)
                    .catch(reject)
                )
                .catch(e => {
                  Log.error(e);
                  reject(e);
                })
            : setLanguage(language)
                .then(resolve)
                .catch(reject);
        })
        .catch(() => {
          const error = 'Language file ' + file + ' not found';
          Log.error(error);
          reject(error);
        });
    })
  };

  const setTranslations = obj => {
    if ('meta' in obj) {
      meta = { ...obj.meta };
      delete obj.meta;
    }
    translations = obj;
  };

  const setLanguage = lng => {
    language = null;

    return new Promise((resolve, reject) => {
      if (lng in translations) {
        language = lng;
      } else {
        if ('map' in meta && lng in meta.map && meta.map[lng] in translations) {
          language = meta.map[lng];
        } else if ('default' in meta && meta.default in translations) {
          language = meta.default;
          const error =
            'Translations for Language ' +
            language +
            ' not found. Using default language ' +
            meta.default;
          Log.warn(error);
          reject(error);
        } else {
          const error = 'Translations for Language ' + language + ' not found.';
          Log.error(error);
          reject(error);
        }
      }

      if (language) {
        Log.info('Setting language to', language);

        const translationsObj = translations[language];
        if (typeof translationsObj === 'object') {
          resolve();
        } else if (typeof translationsObj === 'string') {
          const url = Utils.asset(translationsObj);

          fetch(url)
            .then(response => response.json())
            .then(json => {
              // save the translations for this language (to prevent loading twice)
              translations[language] = json;
              resolve();
            })
            .catch(e => {
              const error = 'Error while fetching ' + url;
              Log.error(error, e);
              reject(error);
            });
        }
      }
    })
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const registry = {
    eventListeners: [],
    timeouts: [],
    intervals: [],
    targets: [],
  };

  var Registry = {
    // Timeouts
    setTimeout(cb, timeout, ...params) {
      const timeoutId = setTimeout(
        () => {
          registry.timeouts = registry.timeouts.filter(id => id !== timeoutId);
          cb.apply(null, params);
        },
        timeout,
        params
      );
      Log.info('Set Timeout', 'ID: ' + timeoutId);
      registry.timeouts.push(timeoutId);
      return timeoutId
    },

    clearTimeout(timeoutId) {
      if (registry.timeouts.indexOf(timeoutId) > -1) {
        registry.timeouts = registry.timeouts.filter(id => id !== timeoutId);
        Log.info('Clear Timeout', 'ID: ' + timeoutId);
        clearTimeout(timeoutId);
      } else {
        Log.error('Clear Timeout', 'ID ' + timeoutId + ' not found');
      }
    },

    clearTimeouts() {
      registry.timeouts.forEach(timeoutId => {
        this.clearTimeout(timeoutId);
      });
    },

    // Intervals
    setInterval(cb, interval, ...params) {
      const intervalId = setInterval(
        () => {
          registry.intervals = registry.intervals.filter(id => id !== intervalId);
          cb.apply(null, params);
        },
        interval,
        params
      );
      Log.info('Set Interval', 'ID: ' + intervalId);
      registry.intervals.push(intervalId);
      return intervalId
    },

    clearInterval(intervalId) {
      if (registry.intervals.indexOf(intervalId) > -1) {
        registry.intervals = registry.intervals.filter(id => id !== intervalId);
        Log.info('Clear Interval', 'ID: ' + intervalId);
        clearInterval(intervalId);
      } else {
        Log.error('Clear Interval', 'ID ' + intervalId + ' not found');
      }
    },

    clearIntervals() {
      registry.intervals.forEach(intervalId => {
        this.clearInterval(intervalId);
      });
    },

    // Event listeners
    addEventListener(target, event, handler) {
      target.addEventListener(event, handler);
      let targetIndex =
        registry.targets.indexOf(target) > -1
          ? registry.targets.indexOf(target)
          : registry.targets.push(target) - 1;

      registry.eventListeners[targetIndex] = registry.eventListeners[targetIndex] || {};
      registry.eventListeners[targetIndex][event] = registry.eventListeners[targetIndex][event] || [];
      registry.eventListeners[targetIndex][event].push(handler);
      Log.info('Add eventListener', 'Target:', target, 'Event: ' + event, 'Handler:', handler);
    },

    removeEventListener(target, event, handler) {
      const targetIndex = registry.targets.indexOf(target);
      if (
        targetIndex > -1 &&
        registry.eventListeners[targetIndex] &&
        registry.eventListeners[targetIndex][event] &&
        registry.eventListeners[targetIndex][event].indexOf(handler) > -1
      ) {
        registry.eventListeners[targetIndex][event] = registry.eventListeners[targetIndex][
          event
        ].filter(fn => fn !== handler);
        Log.info('Remove eventListener', 'Target:', target, 'Event: ' + event, 'Handler:', handler);
        target.removeEventListener(event, handler);
      } else {
        Log.error(
          'Remove eventListener',
          'Not found',
          'Target',
          target,
          'Event: ' + event,
          'Handler',
          handler
        );
      }
    },

    // if `event` is omitted, removes all registered event listeners for target
    // if `target` is also omitted, removes all registered event listeners
    removeEventListeners(target, event) {
      if (target && event) {
        const targetIndex = registry.targets.indexOf(target);
        if (targetIndex > -1) {
          registry.eventListeners[targetIndex][event].forEach(handler => {
            this.removeEventListener(target, event, handler);
          });
        }
      } else if (target) {
        const targetIndex = registry.targets.indexOf(target);
        if (targetIndex > -1) {
          Object.keys(registry.eventListeners[targetIndex]).forEach(_event => {
            this.removeEventListeners(target, _event);
          });
        }
      } else {
        Object.keys(registry.eventListeners).forEach(targetIndex => {
          this.removeEventListeners(registry.targets[targetIndex]);
        });
      }
    },

    // Clear everything (to be called upon app close for proper cleanup)
    clear() {
      this.clearTimeouts();
      this.clearIntervals();
      this.removeEventListeners();
      registry.eventListeners = [];
      registry.timeouts = [];
      registry.intervals = [];
      registry.targets = [];
    },
  };

  var version = "3.0.0";

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let AppInstance;

  const defaultOptions = {
    stage: { w: 1920, h: 1080, clearColor: 0x00000000, canvas2d: false },
    debug: false,
    defaultFontFace: 'RobotoRegular',
    keys: {
      8: 'Back',
      13: 'Enter',
      27: 'Menu',
      37: 'Left',
      38: 'Up',
      39: 'Right',
      40: 'Down',
      174: 'ChannelDown',
      175: 'ChannelUp',
      178: 'Stop',
      250: 'PlayPause',
      191: 'Search', // Use "/" for keyboard
      409: 'Search',
    },
  };

  if (window.innerHeight === 720) {
    defaultOptions.stage['w'] = 1280;
    defaultOptions.stage['h'] = 720;
    defaultOptions.stage['precision'] = 0.6666666667;
  }

  function Application(App, appData, platformSettings) {
    return class Application extends Lightning.Application {
      constructor(options) {
        const config = cjs(defaultOptions, options);
        super(config);
        this.config = config;
      }

      static _template() {
        return {
          w: 1920,
          h: 1080,
        }
      }

      _setup() {
        Promise.all([
          this.loadFonts((App.config && App.config.fonts) || (App.getFonts && App.getFonts()) || []),
          // to be deprecated
          Locale$1.load((App.config && App.config.locale) || (App.getLocale && App.getLocale())),
          App.language && this.loadLanguage(App.language()),
        ])
          .then(() => {
            Metrics$1.app.loaded();

            AppInstance = this.stage.c({
              ref: 'App',
              type: App,
              zIndex: 1,
              forceZIndexContext: !!platformSettings.showVersion || !!platformSettings.showFps,
            });

            this.childList.a(AppInstance);

            Log.info('App version', this.config.version);
            Log.info('SDK version', version);

            if (platformSettings.showVersion) {
              this.childList.a({
                ref: 'VersionLabel',
                type: VersionLabel,
                version: this.config.version,
                sdkVersion: version,
                zIndex: 1,
              });
            }

            if (platformSettings.showFps) {
              this.childList.a({
                ref: 'FpsCounter',
                type: FpsIndicator,
                zIndex: 1,
              });
            }

            super._setup();
          })
          .catch(console.error);
      }

      _handleBack() {
        this.closeApp();
      }

      _handleExit() {
        this.closeApp();
      }

      closeApp() {
        Log.info('Closing App');

        Settings.clearSubscribers();
        Registry.clear();

        if (platformSettings.onClose && typeof platformSettings.onClose === 'function') {
          platformSettings.onClose();
        } else {
          this.close();
        }
      }

      close() {
        Log.info('Closing App');
        this.childList.remove(this.tag('App'));

        // force texture garbage collect
        this.stage.gc();
        this.destroy();
      }

      loadFonts(fonts) {
        return new Promise((resolve, reject) => {
          fonts
            .map(({ family, url, descriptors }) => () => {
              const fontFace = new FontFace(family, 'url(' + url + ')', descriptors || {});
              document.fonts.add(fontFace);
              return fontFace.load()
            })
            .reduce((promise, method) => {
              return promise.then(() => method())
            }, Promise.resolve(null))
            .then(resolve)
            .catch(reject);
        })
      }

      loadLanguage(config) {
        let file = Utils.asset('translations.json');
        let language = null;

        if (typeof config === 'object' && ('file' in config || 'language' in config)) {
          language = config.language || null;
          file = config.file && config.file;
        } else {
          language = config;
        }

        return initLanguage(file, language)
      }

      set focus(v) {
        this._focussed = v;
        this._refocus();
      }

      _getFocused() {
        return this._focussed || this.tag('App')
      }
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  class RoutedApp extends Lightning.Component {
    static _template() {
      return {
        Pages: {
          forceZIndexContext: true,
        },
        /**
         * This is a default Loading page that will be made visible
         * during data-provider on() you CAN override in child-class
         */
        Loading: {
          rect: true,
          w: 1920,
          h: 1080,
          color: 0xff000000,
          visible: false,
          zIndex: 99,
          Label: {
            mount: 0.5,
            x: 960,
            y: 540,
            text: {
              text: 'Loading..',
            },
          },
        },
      }
    }

    static _states() {
      return [
        class Loading extends this {
          $enter() {
            this.tag('Loading').visible = true;
          }

          $exit() {
            this.tag('Loading').visible = false;
          }
        },
        class Widgets extends this {
          $enter(args, widget) {
            // store widget reference
            this._widget = widget;

            // since it's possible that this behaviour
            // is non-remote driven we force a recalculation
            // of the focuspath
            this._refocus();
          }

          _getFocused() {
            // we delegate focus to selected widget
            // so it can consume remotecontrol presses
            return this._widget
          }

          // if we want to widget to widget focus delegation
          reload(widget) {
            this._widget = widget;
            this._refocus();
          }

          _handleKey() {
            restore();
          }
        },
      ]
    }

    /**
     * Return location where pages need to be stored
     */
    get pages() {
      return this.tag('Pages')
    }

    /**
     * Tell router where widgets are stored
     */
    get widgets() {
      return this.tag('Widgets')
    }

    /**
     * we MUST register _handleBack method so the Router
     * can override it
     * @private
     */
    _handleBack() {}

    /**
     * we MUST register _captureKey for dev quick-navigation
     * (via keyboard 1-9)
     */
    _captureKey() {}

    /**
     * We MUST return Router.activePage() so the new Page
     * can listen to the remote-control.
     */
    _getFocused() {
      return getActivePage()
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const running = new Map();
  const resolved = new Map();
  const expired = new Map();
  const rejected = new Map();
  const active = new Map();

  const send = (hash, key, value) => {
    if (!Settings.get('platform', 'stats')) {
      return
    }
    if (!key && !value) {
      if (!running.has(hash)) {
        running.set(hash, {
          start: Date.now(),
        });
      }
    } else {
      if (running.has(hash)) {
        if (key && value) {
          const payload = running.get(hash);
          payload[key] = value;
        }
      }
    }
    if (key && commands[key]) {
      const command = commands[key];
      if (command) {
        command.call(null, hash);
      }
    }
  };

  const move = (hash, bucket, args) => {
    if (active.has(hash)) {
      const payload = active.get(hash);
      const route = payload.route;

      // we group by route so store
      // the hash in the payload
      payload.hash = hash;

      if (isObject(args)) {
        Object.keys(args).forEach(prop => {
          payload[prop] = args[prop];
        });
      }
      if (bucket.has(route)) {
        const records = bucket.get(route);
        records.push(payload);
        bucket.set(route, records);
      } else {
        // we add by route and group all
        // resolved hashes against that route
        bucket.set(route, [payload]);
      }
      active.delete(hash);
    }
  };

  const commands = {
    ready: hash => {
      if (running.has(hash)) {
        const payload = running.get(hash);
        payload.ready = Date.now();
        active.set(hash, payload);

        running.delete(hash);
      }
    },
    stop: hash => {
      move(hash, resolved, {
        stop: Date.now(),
      });
    },
    error: hash => {
      move(hash, rejected, {
        error: Date.now(),
      });
    },
    expired: hash => {
      move(hash, expired, {
        expired: Date.now,
      });
    },
  };

  const output = (label, bucket) => {
    Log.info(`Output: ${label}`, bucket);
    for (let [route, records] of bucket.entries()) {
      Log.debug(`route: ${route}`, records);
    }
  };

  let getStats = () => {
    output('Resolved', resolved);
    output('Expired', expired);
    output('Rejected', rejected);
    output('Expired', expired);
    output('Still active', active);
    output('Still running', running);
  };

  var stats = {
    send,
    getStats,
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let getHash = () => {
    return document.location.hash
  };

  let setHash = url => {
    document.location.hash = url;
  };

  const initRouter = config => {
    if (config.getHash) {
      getHash = config.getHash;
    }
    if (config.setHash) {
      setHash = config.setHash;
    }
  };

  //instance of Lightning.Component
  let app;

  let stage;
  let widgetsHost;
  let pagesHost;

  const pages = new Map();
  const providers = new Map();
  const modifiers = new Map();

  let register = new Map();
  let routerConfig;

  // widget that has focus
  let activeWidget;
  let history = [];
  let activeHash;
  let lastHash = true;
  let previousState;

  // page that has focus
  let activePage;
  const hasRegex = /\{\/(.*?)\/([igm]{0,3})\}/g;
  const isWildcard = /^[!*$]$/;

  const create = type => {
    const page = stage.c({ type, visible: false });

    return page
  };

  /**
   * The actual loading of the component
   * @param {String} route - the route blueprint, used for data provider look up
   * @param {String} hash - current hash we're routing to
   * */
  const load = async ({ route, hash }) => {
    let expired = false;
    // for now we maintain one instance of the
    // navigation register and create a local copy
    // that we hand over to the loader
    const routeReg = new Map(register);
    try {
      const payload = await loader({ hash, route, routeReg });
      if (payload && payload.hash === lastHash) {
        // in case of on() providing we need to reset
        // app state;
        if (app.state === 'Loading') ;
        // if instance is share between routes
        // we directly return the payload
        if (payload.share) {
          return payload
        }
        await doTransition(payload.page, activePage);
      } else {
        expired = true;
      }
      // on expired we only cleanup
      if (expired) {
        Log.debug('[router]:', `Rejected ${payload.hash} because route to ${lastHash} started`);
        if (payload.create && !payload.share) {
          // remove from render-tree
          pagesHost.remove(payload.page);
        }
      } else {
        onRouteFulfilled(payload, routeReg);
        // resolve promise
        return payload.page
      }
    } catch (payload) {
      if (!expired) {
        if (payload.create && !payload.share) {
          // remove from render-tree
          pagesHost.remove(payload.page);
        }
        handleError(payload);
      }
    }
  };

  const loader = async ({ route, hash, routeReg: register }) => {
    let type = getPageByRoute(route);
    let isConstruct = isComponentConstructor(type);
    let sharedInstance = false;
    let provide = false;
    let page = null;
    let isCreated = false;

    // if it's an instance bt we're not coming back from
    // history we test if we can re-use this instance
    if (!isConstruct && !register.get(symbols.backtrack)) {
      if (!mustReuse(route)) {
        type = type.constructor;
        isConstruct = true;
      }
    }

    // If type is not a constructor
    if (!isConstruct) {
      page = type;
      // if we have have a data route for current page
      if (providers.has(route)) {
        if (isPageExpired(type) || type[symbols.hash] !== hash) {
          provide = true;
        }
      }
      let currentRoute = activePage && activePage[symbols.route];
      // if the new route is equal to the current route it means that both
      // route share the Component instance and stack location / since this case
      // is conflicting with the way before() and after() loading works we flag it,
      // and check platform settings in we want to re-use instance
      if (route === currentRoute) {
        sharedInstance = true;
      }
    } else {
      page = create(type);
      pagesHost.a(page);
      // test if need to request data provider
      if (providers.has(route)) {
        provide = true;
      }
      isCreated = true;
    }

    // we store hash and route as properties on the page instance
    // that way we can easily calculate new behaviour on page reload
    page[symbols.hash] = hash;
    page[symbols.route] = route;

    const payload = {
      page,
      route,
      hash,
      register,
      create: isCreated,
      share: sharedInstance,
      event: [isCreated ? 'mounted' : 'changed'],
    };

    try {
      if (provide) {
        const { type: loadType } = providers.get(route);
        // update payload
        payload.loadType = loadType;

        // update statistics
        send$1(hash, `${loadType}-start`, Date.now());
        await triggers[sharedInstance ? 'shared' : loadType](payload);
        send$1(hash, `${loadType}-end`, Date.now());

        if (hash !== lastHash) {
          return false
        } else {
          emit(page, 'dataProvided');
          // resolve promise
          return payload
        }
      } else {
        addPersistData(payload);
        return payload
      }
    } catch (e) {
      payload.error = e;
      return Promise.reject(payload)
    }
  };

  /**
   * Will be called when a new navigate() request has completed
   * and has not been expired due to it's async nature
   * @param page
   * @param route
   * @param event
   * @param hash
   * @param register
   */
  const onRouteFulfilled = ({ page, route, event, hash, share }, register) => {
    // clean up history if modifier is set
    if (hashmod(hash, 'clearHistory')) {
      history.length = 0;
    } else if (activeHash && !isWildcard.test(route)) {
      updateHistory(activeHash);
    }

    // we only update the stackLocation if a route
    // is not expired before it resolves
    const location = getPageStackLocation(route);

    if (!isNaN(location)) {
      let stack = pages.get(route);
      stack[location] = page;
      pages.set(route, stack);
    }

    if (event) {
      emit(page, event);
    }

    // force refocus of the app
    app._refocus();

    // we want to clean up if there is an
    // active page that is not being shared
    // between current and previous route
    if (activePage && !share) {
      cleanUp(activePage, activePage[symbols.route], register);
    }

    // flag this navigation cycle as ready
    send$1(hash, 'ready');

    activePage = page;
    activeHash = hash;

    Log.info('[route]:', route);
    Log.info('[hash]:', hash);
  };

  const triggerAfter = args => {
    // after() we execute the provider
    // and resolve immediately
    try {
      execProvider(args);
    } catch (e) {
      // we fail silently
    }
    return Promise.resolve()
  };

  const triggerBefore = args => {
    // before() we continue only when data resolved
    return execProvider(args)
  };

  const triggerOn = args => {
    // on() we need to place the app in
    // a Loading state and recover from it
    // on resolve
    previousState = app.state || '';
    app._setState('Loading');
    return execProvider(args)
  };

  const triggerShared = args => {
    return execProvider(args)
  };

  const triggers = {
    on: triggerOn,
    after: triggerAfter,
    before: triggerBefore,
    shared: triggerShared,
  };

  const emit = (page, events = [], params = {}) => {
    if (!isArray(events)) {
      events = [events];
    }
    events.forEach(e => {
      const event = `_on${ucfirst(e)}`;
      if (isFunction(page[event])) {
        page[event](params);
      }
    });
  };

  const send$1 = (hash, key, value) => {
    stats.send(hash, key, value);
  };

  const handleError = args => {
    if (!args.page) {
      console.error(args);
    } else {
      const hash = args.page[symbols.hash];
      // flag this navigation cycle as rejected
      send$1(hash, 'e', args.error);
      // force expire
      args.page[symbols.expires] = Date.now();
      if (pages.has('!')) {
        load({ route: '!', hash }).then(errorPage => {
          errorPage.error = { page: args.page, error: args.error };
          // on() loading type will force the app to go
          // in a loading state so on error we need to
          // go back to root state
          if (app.state === 'Loading') ;
          // make sure we delegate focus to the error page
          if (activePage !== errorPage) {
            activePage = errorPage;
            app._refocus();
          }
        });
      } else {
        Log.error(args.page, args.error);
      }
    }
  };

  const updateHistory = hash => {
    const storeHash = getMod(hash, 'store');
    const regStore = register.get(symbols.store);
    let configPrevent = hashmod(hash, 'preventStorage');
    let configStore = true;

    if ((isBoolean(storeHash) && storeHash === false) || configPrevent) {
      configStore = false;
    }

    if (regStore && configStore) {
      const toStore = hash.replace(/^\//, '');
      const location = history.indexOf(toStore);
      // store hash if it's not a part of history or flag for
      // storage of same hash is true
      if (location === -1 || routerConfig.get('storeSameHash')) {
        history.push(toStore);
      } else {
        // if we visit the same route we want to sync history
        history.push(history.splice(location, 1)[0]);
      }
    }
  };

  const mustReuse = route => {
    const mod = routemod(route, 'reuseInstance');
    const config = routerConfig.get('reuseInstance');

    // route always has final decision
    if (isBoolean(mod)) {
      return mod
    }
    return !(isBoolean(config) && config === false)
  };

  const addPersistData = ({ page, route, hash, register = new Map() }) => {
    const urlValues = getValuesFromHash(hash, route);
    const pageData = new Map([...urlValues, ...register]);
    const params = {};

    // make dynamic url data available to the page
    // as instance properties
    for (let [name, value] of pageData) {
      page[name] = value;
      params[name] = value;
    }

    // check navigation register for persistent data
    if (register.size) {
      const obj = {};
      for (let [k, v] of register) {
        obj[k] = v;
      }
      page.persist = obj;
    }

    // make url data and persist data available
    // via params property
    page.params = params;
    emit(page, ['urlParams'], params);

    return params
  };

  const execProvider = args => {
    const { cb, expires } = providers.get(args.route);
    const params = addPersistData(args);
    /**
     * In the first version of the Router, a reference to the page is made
     * available to the callback function as property of {params}.
     * Since this is error prone (named url parts are also being spread inside this object)
     * we made the page reference the first parameter and url values the second.
     * -
     * We keep it backwards compatible for now but a warning is showed in the console.
     */
    if (incorrectParams(cb, args.route)) {
      // keep page as params property backwards compatible for now
      return cb({ page: args.page, ...params }).then(() => {
        args.page[symbols.expires] = Date.now() + expires;
      })
    } else {
      return cb(args.page, { ...params }).then(() => {
        args.page[symbols.expires] = Date.now() + expires;
      })
    }
  };

  /**
   * execute transition between new / old page and
   * toggle the defined widgets
   * @todo: platform override default transition
   * @param pageIn
   * @param pageOut
   */
  const doTransition = (pageIn, pageOut = null) => {
    let transition = pageIn.pageTransition || pageIn.easing;

    const hasCustomTransitions = !!(pageIn.smoothIn || pageIn.smoothInOut || transition);
    const transitionsDisabled = routerConfig.get('disableTransitions');

    if (pageIn.easing) {
      console.warn('easing() method is deprecated and will be removed. Use pageTransition()');
    }
    // default behaviour is a visibility toggle
    if (!hasCustomTransitions || transitionsDisabled) {
      pageIn.visible = true;
      if (pageOut) {
        pageOut.visible = false;
      }
      return Promise.resolve()
    }

    if (transition) {
      let type;
      try {
        type = transition.call(pageIn, pageIn, pageOut);
      } catch (e) {
        type = 'crossFade';
      }

      if (isPromise(type)) {
        return type
      }

      if (isString(type)) {
        const fn = Transitions[type];
        if (fn) {
          return fn(pageIn, pageOut)
        }
      }

      // keep backwards compatible for now
      if (pageIn.smoothIn) {
        // provide a smooth function that resolves itself
        // on transition finish
        const smooth = (p, v, args = {}) => {
          return new Promise(resolve => {
            pageIn.visible = true;
            pageIn.setSmooth(p, v, args);
            pageIn.transition(p).on('finish', () => {
              resolve();
            });
          })
        };
        return pageIn.smoothIn({ pageIn, smooth })
      }
    }

    return Transitions.crossFade(pageIn, pageOut)
  };

  const cleanUp = (page, route, register) => {
    const lazyDestroy = routerConfig.get('lazyDestroy');
    const destroyOnBack = routerConfig.get('destroyOnHistoryBack');
    const keepAlive = read('keepAlive', register);
    const isFromHistory = read(symbols.backtrack, register);
    let doCleanup = false;

    if (isFromHistory && (destroyOnBack || lazyDestroy)) {
      doCleanup = true;
    } else if (lazyDestroy && !keepAlive) {
      doCleanup = true;
    }

    if (doCleanup) {
      // in lazy create mode we store constructor
      // and remove the actual page from host
      const stack = pages.get(route);
      const location = getPageStackLocation(route);

      // grab original class constructor if statemachine routed
      // else store constructor
      stack[location] = page._routedType || page.constructor;
      pages.set(route, stack);

      // actual remove of page from memory
      pagesHost.remove(page);

      // force texture gc() if configured
      // so we can cleanup textures in the same tick
      if (routerConfig.get('gcOnUnload')) {
        stage.gc();
      }
    } else {
      // If we're not removing the page we need to
      // reset it's properties
      page.patch({
        x: 0,
        y: 0,
        scale: 1,
        alpha: 1,
        visible: false,
      });
    }
    send$1(page[symbols.hash], 'stop');
  };

  /**
   * Test if page passed cache-time
   * @param page
   * @returns {boolean}
   */
  const isPageExpired = page => {
    if (!page[symbols.expires]) {
      return false
    }

    const expires = page[symbols.expires];
    const now = Date.now();

    return now >= expires
  };

  const getPageByRoute = route => {
    return getPageFromStack(route).item
  };

  /**
   * Returns the current location of a page constructor or
   * page instance for a route
   * @param route
   */
  const getPageStackLocation = route => {
    return getPageFromStack(route).index
  };

  const getPageFromStack = route => {
    if (!pages.has(route)) {
      return false
    }

    let index = -1;
    let item = null;
    let stack = pages.get(route);
    if (!Array.isArray(stack)) {
      stack = [stack];
    }

    for (let i = 0, j = stack.length; i < j; i++) {
      if (isPage(stack[i])) {
        index = i;
        item = stack[i];
        break
      }
    }

    return { index, item }
  };

  /**
   * Simple route length calculation
   * @param route {string}
   * @returns {number} - floor
   */
  const getFloor = route => {
    return stripRegex(route).split('/').length
  };

  /**
   * Test if a route is part regular expressed
   * and replace it for a simple character
   * @param route
   * @returns {*}
   */
  const stripRegex = (route, char = 'R') => {
    // if route is part regular expressed we replace
    // the regular expression for a character to
    // simplify floor calculation and backtracking
    if (hasRegex.test(route)) {
      route = route.replace(hasRegex, char);
    }
    return route
  };

  /**
   * return all stored routes that live on the same floor
   * @param floor
   * @returns {Array}
   */
  const getRoutesByFloor = floor => {
    const matches = [];
    // simple filter of level candidates
    for (let [route] of pages.entries()) {
      if (getFloor(route) === floor) {
        matches.push(route);
      }
    }
    return matches
  };

  /**
   * return a matching route by provided hash
   * hash: home/browse/12 will match:
   * route: home/browse/:categoryId
   * @param hash {string}
   * @returns {string|boolean} - route
   */
  const getRouteByHash = hash => {
    const getUrlParts = /(\/?:?[@\w%\s-]+)/g;
    // grab possible candidates from stored routes
    const candidates = getRoutesByFloor(getFloor(hash));
    // break hash down in chunks
    const hashParts = hash.match(getUrlParts) || [];
    // test if the part of the hash has a replace
    // regex lookup id
    const hasLookupId = /\/:\w+?@@([0-9]+?)@@/;
    const isNamedGroup = /^\/:/;

    // to simplify the route matching and prevent look around
    // in our getUrlParts regex we get the regex part from
    // route candidate and store them so that we can reference
    // them when we perform the actual regex against hash
    let regexStore = [];

    let matches = candidates.filter(route => {
      let isMatching = true;

      if (isWildcard.test(route)) {
        return false
      }

      // replace regex in route with lookup id => @@{storeId}@@
      if (hasRegex.test(route)) {
        const regMatches = route.match(hasRegex);
        if (regMatches && regMatches.length) {
          route = regMatches.reduce((fullRoute, regex) => {
            const lookupId = regexStore.length;
            fullRoute = fullRoute.replace(regex, `@@${lookupId}@@`);
            regexStore.push(regex.substring(1, regex.length - 1));
            return fullRoute
          }, route);
        }
      }

      const routeParts = route.match(getUrlParts) || [];

      for (let i = 0, j = routeParts.length; i < j; i++) {
        const routePart = routeParts[i];
        const hashPart = hashParts[i];

        // Since we support catch-all and regex driven name groups
        // we first test for regex lookup id and see if the regex
        // matches the value from the hash
        if (hasLookupId.test(routePart)) {
          const routeMatches = hasLookupId.exec(routePart);
          const storeId = routeMatches[1];
          const routeRegex = regexStore[storeId];

          // split regex and modifiers so we can use both
          // to create a new RegExp
          // eslint-disable-next-line
          const regMatches = /\/([^\/]+)\/([igm]{0,3})/.exec(routeRegex);

          if (regMatches && regMatches.length) {
            const expression = regMatches[1];
            const modifiers = regMatches[2];

            const regex = new RegExp(`^/${expression}$`, modifiers);

            if (!regex.test(hashPart)) {
              isMatching = false;
            }
          }
        } else if (isNamedGroup.test(routePart)) {
          // we kindly skip namedGroups because this is dynamic
          // we only need to the static and regex drive parts
          continue
        } else if (hashPart && routePart.toLowerCase() !== hashPart.toLowerCase()) {
          isMatching = false;
        }
      }
      return isMatching
    });

    if (matches.length) {
      // we give prio to static routes over dynamic
      matches = matches.sort(a => {
        return isNamedGroup.test(a) ? -1 : 1
      });
      return matches[0]
    }

    return false
  };

  /**
   * Extract dynamic values from location hash and return a namedgroup
   * of key (from route) value (from hash) pairs
   * @param hash {string} - the actual location hash
   * @param route {string} - the route as defined in route
   */
  const getValuesFromHash = (hash, route) => {
    // replace the regex definition from the route because
    // we already did the matching part
    route = stripRegex(route, '');

    const getUrlParts = /(\/?:?[\w%\s-]+)/g;
    const hashParts = hash.match(getUrlParts) || [];
    const routeParts = route.match(getUrlParts) || [];
    const getNamedGroup = /^\/:([\w-]+)\/?/;

    return routeParts.reduce((storage, value, index) => {
      const match = getNamedGroup.exec(value);
      if (match && match.length) {
        storage.set(match[1], decodeURIComponent(hashParts[index].replace(/^\//, '')));
      }
      return storage
    }, new Map())
  };

  const handleHashChange = override => {
    const hash = override || getHash();
    const route = getRouteByHash(hash);

    // add a new record for page statistics
    send$1(hash);

    // store last requested hash so we can
    // prevent a route that resolved later
    // from displaying itself
    lastHash = hash;

    if (route) {
      // would be strange if this fails but we do check
      if (pages.has(route)) {
        let stored = pages.get(route);
        send$1(hash, 'route', route);

        if (!isArray(stored)) {
          stored = [stored];
        }

        stored.forEach((type, idx, stored) => {
          if (isPage(type)) {
            load({ route, hash }).then(() => {
              app._refocus();
            });
          } else if (isPromise(type)) {
            type()
              .then(contents => {
                return contents.default
              })
              .then(module => {
                // flag dynamic as loaded
                stored[idx] = module;

                return load({ route, hash })
              })
              .then(() => {
                app._refocus();
              });
          } else {
            const urlParams = getValuesFromHash(hash, route);
            const params = {};
            for (const key of urlParams.keys()) {
              params[key] = urlParams.get(key);
            }
            // invoke
            type.call(null, app, { ...params });
          }
        });
      }
    } else {
      if (pages.has('*')) {
        load({ route: '*', hash }).then(() => {
          app._refocus();
        });
      }
    }
  };

  const getMod = (hash, key) => {
    const config = modifiers.get(getRouteByHash(hash));
    if (isObject(config)) {
      return config[key]
    }
  };

  const hashmod = (hash, key) => {
    return routemod(getRouteByHash(hash), key)
  };

  const routemod = (route, key) => {
    if (modifiers.has(route)) {
      const config = modifiers.get(route);
      return config[key]
    }
  };

  const read = (flag, register) => {
    if (register.has(flag)) {
      return register.get(flag)
    }
    return false
  };

  const getWidgetByName = name => {
    name = ucfirst(name);
    return widgetsHost.getByRef(name) || false
  };

  /**
   * delegate app focus to a on-screen widget
   * @param name - {string}
   */
  const focusWidget = name => {
    const widget = getWidgetByName(name);
    if (name) {
      // store reference
      activeWidget = widget;
      // somewhat experimental
      if (app.state === 'Widgets') ; else {
        app._setState('Widgets', [activeWidget]);
      }
    }
  };

  const handleRemote = (type, name) => {
    if (type === 'widget') {
      focusWidget(name);
    } else if (type === 'page') {
      restoreFocus();
    }
  };

  const restore = () => {
    if (routerConfig.get('autoRestoreRemote')) {
      handleRemote('page');
    }
  };

  const restoreFocus = () => {
    activeWidget = null;
    app._setState('');
  };

  const getActivePage = () => {
    if (activePage && activePage.attached) {
      return activePage
    } else {
      return app
    }
  };

  // listen to url changes
  window.addEventListener('hashchange', () => {
    handleHashChange();
  });

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  const defaultChannels = [
    {
      number: 1,
      name: 'Metro News 1',
      description: 'New York Cable News Channel',
      entitled: true,
      program: {
        title: 'The Morning Show',
        description: "New York's best morning show",
        startTime: new Date(new Date() - 60 * 5 * 1000).toUTCString(), // started 5 minutes ago
        duration: 60 * 30, // 30 minutes
        ageRating: 0,
      },
    },
    {
      number: 2,
      name: 'MTV',
      description: 'Music Television',
      entitled: true,
      program: {
        title: 'Beavis and Butthead',
        description: 'American adult animated sitcom created by Mike Judge',
        startTime: new Date(new Date() - 60 * 20 * 1000).toUTCString(), // started 20 minutes ago
        duration: 60 * 45, // 45 minutes
        ageRating: 18,
      },
    },
    {
      number: 3,
      name: 'NBC',
      description: 'NBC TV Network',
      entitled: false,
      program: {
        title: 'The Tonight Show Starring Jimmy Fallon',
        description: 'Late-night talk show hosted by Jimmy Fallon on NBC',
        startTime: new Date(new Date() - 60 * 10 * 1000).toUTCString(), // started 10 minutes ago
        duration: 60 * 60, // 1 hour
        ageRating: 10,
      },
    },
  ];

  const channels = () => Settings.get('platform', 'tv', defaultChannels);

  const randomChannel = () => channels()[~~(channels.length * Math.random())];

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let currentChannel;
  const callbacks = {};

  const emit$1 = (event, ...args) => {
    callbacks[event] &&
      callbacks[event].forEach(cb => {
        cb.apply(null, args);
      });
  };

  // local mock methods
  let methods = {
    getChannel() {
      if (!currentChannel) currentChannel = randomChannel();
      return new Promise((resolve, reject) => {
        if (currentChannel) {
          const channel = { ...currentChannel };
          delete channel.program;
          resolve(channel);
        } else {
          reject('No channel found');
        }
      })
    },
    getProgram() {
      if (!currentChannel) currentChannel = randomChannel();
      return new Promise((resolve, reject) => {
        currentChannel.program ? resolve(currentChannel.program) : reject('No program found');
      })
    },
    setChannel(number) {
      return new Promise((resolve, reject) => {
        if (number) {
          const newChannel = channels().find(c => c.number === number);
          if (newChannel) {
            currentChannel = newChannel;
            const channel = { ...currentChannel };
            delete channel.program;
            emit$1('channelChange', channel);
            resolve(channel);
          } else {
            reject('Channel not found');
          }
        } else {
          reject('No channel number supplied');
        }
      })
    },
  };

  const initTV = config => {
    methods = {};
    if (config.getChannel && typeof config.getChannel === 'function') {
      methods.getChannel = config.getChannel;
    }
    if (config.getProgram && typeof config.getProgram === 'function') {
      methods.getProgram = config.getProgram;
    }
    if (config.setChannel && typeof config.setChannel === 'function') {
      methods.setChannel = config.setChannel;
    }
    if (config.emit && typeof config.emit === 'function') {
      config.emit(emit$1);
    }
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let ApplicationInstance;

  var Launch = (App, appSettings, platformSettings, appData) => {
    initSettings(appSettings, platformSettings);

    initUtils(platformSettings);
    initStorage();

    // Initialize plugins
    if (platformSettings.plugins) {
      platformSettings.plugins.profile && initProfile(platformSettings.plugins.profile);
      platformSettings.plugins.metrics && initMetrics(platformSettings.plugins.metrics);
      platformSettings.plugins.mediaPlayer && initMediaPlayer(platformSettings.plugins.mediaPlayer);
      platformSettings.plugins.mediaPlayer && initVideoPlayer(platformSettings.plugins.mediaPlayer);
      platformSettings.plugins.ads && initAds(platformSettings.plugins.ads);
      platformSettings.plugins.router && initRouter(platformSettings.plugins.router);
      platformSettings.plugins.tv && initTV(platformSettings.plugins.tv);
    }

    const app = Application(App, appData, platformSettings);
    ApplicationInstance = new app(appSettings);
    return ApplicationInstance
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  class VideoTexture extends Lightning.Component {
    static _template() {
      return {
        Video: {
          alpha: 1,
          visible: false,
          pivot: 0.5,
          texture: { type: Lightning.textures.StaticTexture, options: {} },
        },
      }
    }

    set videoEl(v) {
      this._videoEl = v;
    }

    get videoEl() {
      return this._videoEl
    }

    get videoView() {
      return this.tag('Video')
    }

    get videoTexture() {
      return this.videoView.texture
    }

    get isVisible() {
      return this.videoView.alpha === 1 && this.videoView.visible === true
    }

    _init() {
      this._createVideoTexture();
    }

    _createVideoTexture() {
      const stage = this.stage;

      const gl = stage.gl;
      const glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.videoTexture.options = { source: glTexture, w: this.videoEl.width, h: this.videoEl.height };

      this.videoView.w = this.videoEl.width / this.stage.getRenderPrecision();
      this.videoView.h = this.videoEl.height / this.stage.getRenderPrecision();
    }

    start() {
      const stage = this.stage;
      if (!this._updateVideoTexture) {
        this._updateVideoTexture = () => {
          if (this.videoTexture.options.source && this.videoEl.videoWidth && this.active) {
            const gl = stage.gl;

            const currentTime = new Date().getTime();

            // When BR2_PACKAGE_GST1_PLUGINS_BAD_PLUGIN_DEBUGUTILS is not set in WPE, webkitDecodedFrameCount will not be available.
            // We'll fallback to fixed 30fps in this case.
            const frameCount = this.videoEl.webkitDecodedFrameCount;

            const mustUpdate = frameCount
              ? this._lastFrame !== frameCount
              : this._lastTime < currentTime - 30;

            if (mustUpdate) {
              this._lastTime = currentTime;
              this._lastFrame = frameCount;
              try {
                gl.bindTexture(gl.TEXTURE_2D, this.videoTexture.options.source);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.videoEl);
                this._lastFrame = this.videoEl.webkitDecodedFrameCount;
                this.videoView.visible = true;

                this.videoTexture.options.w = this.videoEl.width;
                this.videoTexture.options.h = this.videoEl.height;
                const expectedAspectRatio = this.videoView.w / this.videoView.h;
                const realAspectRatio = this.videoEl.width / this.videoEl.height;

                if (expectedAspectRatio > realAspectRatio) {
                  this.videoView.scaleX = realAspectRatio / expectedAspectRatio;
                  this.videoView.scaleY = 1;
                } else {
                  this.videoView.scaleY = expectedAspectRatio / realAspectRatio;
                  this.videoView.scaleX = 1;
                }
              } catch (e) {
                Log.error('texImage2d video', e);
                this.stop();
              }
              this.videoTexture.source.forceRenderUpdate();
            }
          }
        };
      }
      if (!this._updatingVideoTexture) {
        stage.on('frameStart', this._updateVideoTexture);
        this._updatingVideoTexture = true;
      }
    }

    stop() {
      const stage = this.stage;
      stage.removeListener('frameStart', this._updateVideoTexture);
      this._updatingVideoTexture = false;
      this.videoView.visible = false;

      if (this.videoTexture.options.source) {
        const gl = stage.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.videoTexture.options.source);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }

    position(top, left) {
      this.videoView.patch({
        smooth: {
          x: left,
          y: top,
        },
      });
    }

    size(width, height) {
      this.videoView.patch({
        smooth: {
          w: width,
          h: height,
        },
      });
    }

    show() {
      this.videoView.setSmooth('alpha', 1);
    }

    hide() {
      this.videoView.setSmooth('alpha', 0);
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let mediaUrl$1 = url => url;
  let videoEl;
  let videoTexture;
  let metrics$1;
  let consumer;
  let precision = 1;
  let textureMode = false;

  const initVideoPlayer = config => {
    if (config.mediaUrl) {
      mediaUrl$1 = config.mediaUrl;
    }
  };

  // todo: add this in a 'Registry' plugin
  // to be able to always clean this up on app close
  let eventHandlers = {};

  const state = {
    adsEnabled: false,
    playing: false,
    _playingAds: false,
    get playingAds() {
      return this._playingAds
    },
    set playingAds(val) {
      if (this._playingAds !== val) {
        this._playingAds = val;
        fireOnConsumer(val === true ? 'AdStart' : 'AdEnd');
      }
    },
    skipTime: false,
    playAfterSeek: null,
  };

  const hooks = {
    play() {
      state.playing = true;
    },
    pause() {
      state.playing = false;
    },
    seeked() {
      state.playAfterSeek === true && videoPlayerPlugin.play();
      state.playAfterSeek = null;
    },
    abort() {
      deregisterEventListeners();
    },
  };

  const withPrecision = val => Math.round(precision * val) + 'px';

  const fireOnConsumer = (event, args) => {
    if (consumer) {
      consumer.fire('$videoPlayer' + event, args);
      consumer.fire('$videoPlayerEvent', event, args);
    }
  };

  const fireHook = (event, args) => {
    hooks[event] && typeof hooks[event] === 'function' && hooks[event].call(null, event, args);
  };

  const setupVideoTag = () => {
    const videoEls = document.getElementsByTagName('video');
    if (videoEls && videoEls.length) {
      return videoEls[0]
    } else {
      const videoEl = document.createElement('video');
      videoEl.setAttribute('id', 'video-player');
      videoEl.setAttribute('width', withPrecision(1920));
      videoEl.setAttribute('height', withPrecision(1080));
      videoEl.setAttribute('crossorigin', 'anonymous');
      videoEl.style.position = 'absolute';
      videoEl.style.zIndex = '1';
      videoEl.style.display = 'none';
      videoEl.style.visibility = 'hidden';
      videoEl.style.top = withPrecision(0);
      videoEl.style.left = withPrecision(0);
      videoEl.style.width = withPrecision(1920);
      videoEl.style.height = withPrecision(1080);
      document.body.appendChild(videoEl);
      return videoEl
    }
  };

  const setUpVideoTexture = () => {
    if (!ApplicationInstance.tag('VideoTexture')) {
      const el = ApplicationInstance.stage.c({
        type: VideoTexture,
        ref: 'VideoTexture',
        zIndex: 0,
        videoEl,
      });
      ApplicationInstance.childList.addAt(el, 0);
    }
    return ApplicationInstance.tag('VideoTexture')
  };

  const registerEventListeners = () => {
    Log.info('VideoPlayer', 'Registering event listeners');
    Object.keys(events).forEach(event => {
      const handler = e => {
        // Fire a metric for each event (if it exists on the metrics object)
        if (metrics$1 && metrics$1[event] && typeof metrics$1[event] === 'function') {
          metrics$1[event]({ currentTime: videoEl.currentTime });
        }
        // fire an internal hook
        fireHook(event, { videoElement: videoEl, event: e });

        // fire the event (with human friendly event name) to the consumer of the VideoPlayer
        fireOnConsumer(events[event], { videoElement: videoEl, event: e });
      };

      eventHandlers[event] = handler;
      videoEl.addEventListener(event, handler);
    });
  };

  const deregisterEventListeners = () => {
    Log.info('VideoPlayer', 'Deregistering event listeners');
    Object.keys(eventHandlers).forEach(event => {
      videoEl.removeEventListener(event, eventHandlers[event]);
    });
    eventHandlers = {};
  };

  const videoPlayerPlugin = {
    consumer(component) {
      consumer = component;
    },

    position(top = 0, left = 0) {
      videoEl.style.left = withPrecision(left);
      videoEl.style.top = withPrecision(top);
      if (textureMode === true) {
        videoTexture.position(top, left);
      }
    },

    size(width = 1920, height = 1080) {
      videoEl.style.width = withPrecision(width);
      videoEl.style.height = withPrecision(height);
      videoEl.width = parseFloat(videoEl.style.width);
      videoEl.height = parseFloat(videoEl.style.height);
      if (textureMode === true) {
        videoTexture.size(width, height);
      }
    },

    area(top = 0, right = 1920, bottom = 1080, left = 0) {
      this.position(top, left);
      this.size(right - left, bottom - top);
    },

    open(url, details = {}) {
      if (!this.canInteract) return
      metrics$1 = Metrics$1.media(url);
      // prep the media url to play depending on platform
      url = mediaUrl$1(url);

      // if url is same as current clear (which is effectively a reload)
      if (this.src == url) {
        this.clear();
      }

      this.hide();
      deregisterEventListeners();

      // preload the video to get duration (for ads)
      //.. currently actually not working because loadedmetadata didn't work reliably on Sky boxes
      videoEl.setAttribute('src', url);
      videoEl.load();

      // const onLoadedMetadata = () => {
      // videoEl.removeEventListener('loadedmetadata', onLoadedMetadata)
      const config = { enabled: state.adsEnabled, duration: 300 }; // this.duration ||
      if (details.videoId) {
        config.caid = details.videoId;
      }
      Ads.get(config, consumer).then(ads => {
        state.playingAds = true;
        ads.prerolls().then(() => {
          state.playingAds = false;
          registerEventListeners();
          if (this.src !== url) {
            videoEl.setAttribute('src', url);
            videoEl.load();
          }
          this.show();
          setTimeout(() => {
            this.play();
          });
        });
      });
      // }

      // videoEl.addEventListener('loadedmetadata', onLoadedMetadata)
    },

    reload() {
      if (!this.canInteract) return
      const url = videoEl.getAttribute('src');
      this.close();
      this.open(url);
    },

    close() {
      Ads.cancel();
      if (state.playingAds) {
        state.playingAds = false;
        Ads.stop();
        // call self in next tick
        setTimeout(() => {
          this.close();
        });
      }
      if (!this.canInteract) return
      this.clear();
      this.hide();
      deregisterEventListeners();
    },

    clear() {
      if (!this.canInteract) return
      // pause the video first to disable sound
      this.pause();
      if (textureMode === true) videoTexture.stop();
      videoEl.removeAttribute('src');
      videoEl.load();
    },

    play() {
      if (!this.canInteract) return
      if (textureMode === true) videoTexture.start();
      videoEl.play();
    },

    pause() {
      if (!this.canInteract) return
      videoEl.pause();
    },

    playPause() {
      if (!this.canInteract) return
      this.playing === true ? this.pause() : this.play();
    },

    mute(muted = true) {
      if (!this.canInteract) return
      videoEl.muted = muted;
    },

    loop(looped = true) {
      videoEl.loop = looped;
    },

    seek(time) {
      if (!this.canInteract) return
      if (!this.src) return
      // define whether should continue to play after seek is complete (in seeked hook)
      if (state.playAfterSeek === null) {
        state.playAfterSeek = !!state.playing;
      }
      // pause before actually seeking
      this.pause();
      // currentTime always between 0 and the duration of the video (minus 0.1s to not set to the final frame and stall the video)
      videoEl.currentTime = Math.max(0, Math.min(time, this.duration - 0.1));
    },

    skip(seconds) {
      if (!this.canInteract) return
      if (!this.src) return

      state.skipTime = (state.skipTime || videoEl.currentTime) + seconds;
      easeExecution(() => {
        this.seek(state.skipTime);
        state.skipTime = false;
      }, 300);
    },

    show() {
      if (!this.canInteract) return
      if (textureMode === true) {
        videoTexture.show();
      } else {
        videoEl.style.display = 'block';
        videoEl.style.visibility = 'visible';
      }
    },

    hide() {
      if (!this.canInteract) return
      if (textureMode === true) {
        videoTexture.hide();
      } else {
        videoEl.style.display = 'none';
        videoEl.style.visibility = 'hidden';
      }
    },

    enableAds(enabled = true) {
      state.adsEnabled = enabled;
    },

    /* Public getters */
    get duration() {
      return videoEl && (isNaN(videoEl.duration) ? Infinity : videoEl.duration)
    },

    get currentTime() {
      return videoEl && videoEl.currentTime
    },

    get muted() {
      return videoEl && videoEl.muted
    },

    get looped() {
      return videoEl && videoEl.loop
    },

    get src() {
      return videoEl && videoEl.getAttribute('src')
    },

    get playing() {
      return state.playing
    },

    get playingAds() {
      return state.playingAds
    },

    get canInteract() {
      // todo: perhaps add an extra flag wether we allow interactions (i.e. pauze, mute, etc.) during ad playback
      return state.playingAds === false
    },

    get top() {
      return videoEl && parseFloat(videoEl.style.top)
    },

    get left() {
      return videoEl && parseFloat(videoEl.style.left)
    },

    get bottom() {
      return videoEl && parseFloat(videoEl.style.top - videoEl.style.height)
    },

    get right() {
      return videoEl && parseFloat(videoEl.style.left - videoEl.style.width)
    },

    get width() {
      return videoEl && parseFloat(videoEl.style.width)
    },

    get height() {
      return videoEl && parseFloat(videoEl.style.height)
    },

    get visible() {
      if (textureMode === true) {
        return videoTexture.isVisible
      } else {
        return videoEl && videoEl.style.display === 'block'
      }
    },

    get adsEnabled() {
      return state.adsEnabled
    },

    // prefixed with underscore to indicate 'semi-private'
    // because it's not recommended to interact directly with the video element
    get _videoEl() {
      return videoEl
    },
  };

  var VideoPlayer = autoSetupMixin(videoPlayerPlugin, () => {
    precision =
      ApplicationInstance &&
      ApplicationInstance.stage &&
      ApplicationInstance.stage.getRenderPrecision();

    videoEl = setupVideoTag();

    textureMode = Settings.get('platform', 'textureMode', false);
    if (textureMode === true) {
      videoTexture = setUpVideoTexture();
    }
  });

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  let consumer$1;

  let getAds = () => {
    // todo: enable some default ads during development, maybe from the settings.json
    return Promise.resolve({
      prerolls: [],
      midrolls: [],
      postrolls: [],
    })
  };

  const initAds = config => {
    if (config.getAds) {
      getAds = config.getAds;
    }
  };

  const state$1 = {
    active: false,
  };

  const playSlot = (slot = []) => {
    return slot.reduce((promise, ad) => {
      return promise.then(() => {
        return playAd(ad)
      })
    }, Promise.resolve(null))
  };

  const playAd = ad => {
    return new Promise(resolve => {
      if (state$1.active === false) {
        Log.info('Ad', 'Skipping add due to inactive state');
        return resolve()
      }
      // is it safe to rely on videoplayer plugin already created the video tag?
      const videoEl = document.getElementsByTagName('video')[0];
      videoEl.style.display = 'block';
      videoEl.style.visibility = 'visible';
      videoEl.src = mediaUrl$1(ad.url);
      videoEl.load();

      let timeEvents = null;
      let timeout;

      const cleanup = () => {
        // remove all listeners
        Object.keys(handlers).forEach(handler =>
          videoEl.removeEventListener(handler, handlers[handler])
        );
        resolve();
      };
      const handlers = {
        play() {
          Log.info('Ad', 'Play ad', ad.url);
          fireOnConsumer$1('Play', ad);
          sendBeacon(ad.callbacks, 'defaultImpression');
        },
        ended() {
          fireOnConsumer$1('Ended', ad);
          sendBeacon(ad.callbacks, 'complete');
          cleanup();
        },
        timeupdate() {
          if (!timeEvents && videoEl.duration) {
            // calculate when to fire the time based events (now that duration is known)
            timeEvents = {
              firstQuartile: videoEl.duration / 4,
              midPoint: videoEl.duration / 2,
              thirdQuartile: (videoEl.duration / 4) * 3,
            };
            Log.info('Ad', 'Calculated quartiles times', { timeEvents });
          }
          if (
            timeEvents &&
            timeEvents.firstQuartile &&
            videoEl.currentTime >= timeEvents.firstQuartile
          ) {
            fireOnConsumer$1('FirstQuartile', ad);
            delete timeEvents.firstQuartile;
            sendBeacon(ad.callbacks, 'firstQuartile');
          }
          if (timeEvents && timeEvents.midPoint && videoEl.currentTime >= timeEvents.midPoint) {
            fireOnConsumer$1('MidPoint', ad);
            delete timeEvents.midPoint;
            sendBeacon(ad.callbacks, 'midPoint');
          }
          if (
            timeEvents &&
            timeEvents.thirdQuartile &&
            videoEl.currentTime >= timeEvents.thirdQuartile
          ) {
            fireOnConsumer$1('ThirdQuartile', ad);
            delete timeEvents.thirdQuartile;
            sendBeacon(ad.callbacks, 'thirdQuartile');
          }
        },
        stalled() {
          fireOnConsumer$1('Stalled', ad);
          timeout = setTimeout(() => {
            cleanup();
          }, 5000); // make timeout configurable
        },
        canplay() {
          timeout && clearTimeout(timeout);
        },
        error() {
          fireOnConsumer$1('Error', ad);
          cleanup();
        },
        // this doesn't work reliably on sky box, moved logic to timeUpdate event
        // loadedmetadata() {
        //   // calculate when to fire the time based events (now that duration is known)
        //   timeEvents = {
        //     firstQuartile: videoEl.duration / 4,
        //     midPoint: videoEl.duration / 2,
        //     thirdQuartile: (videoEl.duration / 4) * 3,
        //   }
        // },
        abort() {
          cleanup();
        },
        // todo: pause, resume, mute, unmute beacons
      };
      // add all listeners
      Object.keys(handlers).forEach(handler => videoEl.addEventListener(handler, handlers[handler]));

      videoEl.play();
    })
  };

  const sendBeacon = (callbacks, event) => {
    if (callbacks && callbacks[event]) {
      Log.info('Ad', 'Sending beacon', event, callbacks[event]);
      return callbacks[event].reduce((promise, url) => {
        return promise.then(() =>
          fetch(url)
            // always resolve, also in case of a fetch error (so we don't block firing the rest of the beacons for this event)
            // note: for fetch failed http responses don't throw an Error :)
            .then(response => {
              if (response.status === 200) {
                fireOnConsumer$1('Beacon' + event + 'Sent');
              } else {
                fireOnConsumer$1('Beacon' + event + 'Failed' + response.status);
              }
            })
            .catch(() => {
            })
        )
      }, Promise.resolve(null))
    } else {
      Log.info('Ad', 'No callback found for ' + event);
    }
  };

  const fireOnConsumer$1 = (event, args) => {
    if (consumer$1) {
      consumer$1.fire('$ad' + event, args);
      consumer$1.fire('$adEvent', event, args);
    }
  };

  var Ads = {
    get(config, videoPlayerConsumer) {
      if (config.enabled === false) {
        return Promise.resolve({
          prerolls() {
            return Promise.resolve()
          },
        })
      }
      consumer$1 = videoPlayerConsumer;

      return new Promise(resolve => {
        Log.info('Ad', 'Starting session');
        getAds(config).then(ads => {
          Log.info('Ad', 'API result', ads);
          resolve({
            prerolls() {
              if (ads.preroll) {
                state$1.active = true;
                fireOnConsumer$1('PrerollSlotImpression', ads);
                sendBeacon(ads.preroll.callbacks, 'slotImpression');
                return playSlot(ads.preroll.ads).then(() => {
                  fireOnConsumer$1('PrerollSlotEnd', ads);
                  sendBeacon(ads.preroll.callbacks, 'slotEnd');
                  state$1.active = false;
                })
              }
              return Promise.resolve()
            },
            midrolls() {
              return Promise.resolve()
            },
            postrolls() {
              return Promise.resolve()
            },
          });
        });
      })
    },
    cancel() {
      Log.info('Ad', 'Cancel Ad');
      state$1.active = false;
    },
    stop() {
      Log.info('Ad', 'Stop Ad');
      state$1.active = false;
      // fixme: duplication
      const videoEl = document.getElementsByTagName('video')[0];
      videoEl.pause();
      videoEl.removeAttribute('src');
    },
  };

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  class ScaledImageTexture extends Lightning.textures.ImageTexture {
    constructor(stage) {
      super(stage);
      this._scalingOptions = undefined;
    }

    set options(options) {
      this.resizeMode = this._scalingOptions = options;
    }

    _getLookupId() {
      return `${this._src}-${this._scalingOptions.type}-${this._scalingOptions.w}-${this._scalingOptions.h}`
    }

    getNonDefaults() {
      const obj = super.getNonDefaults();
      if (this._src) {
        obj.src = this._src;
      }
      return obj
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  class PinInput extends Lightning.Component {
    static _template() {
      return {
        w: 120,
        h: 150,
        rect: true,
        color: 0xff949393,
        alpha: 0.5,
        shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
        Nr: {
          w: w => w,
          y: 24,
          text: {
            text: '',
            textColor: 0xff333333,
            fontSize: 80,
            textAlign: 'center',
            verticalAlign: 'middle',
          },
        },
      }
    }

    set index(v) {
      this.x = v * (120 + 24);
    }

    set nr(v) {
      this._timeout && clearTimeout(this._timeout);

      if (v) {
        this.setSmooth('alpha', 1);
      } else {
        this.setSmooth('alpha', 0.5);
      }

      this.tag('Nr').patch({
        text: {
          text: (v && v.toString()) || '',
          fontSize: v === '*' ? 120 : 80,
        },
      });

      if (v && v !== '*') {
        this._timeout = setTimeout(() => {
          this._timeout = null;
          this.nr = '*';
        }, 750);
      }
    }
  }

  class PinDialog extends Lightning.Component {
    static _template() {
      return {
        w: w => w,
        h: h => h,
        rect: true,
        color: 0xdd000000,
        alpha: 0.000001,
        Dialog: {
          w: 648,
          h: 320,
          y: h => (h - 320) / 2,
          x: w => (w - 648) / 2,
          rect: true,
          color: 0xdd333333,
          shader: { type: Lightning.shaders.RoundedRectangle, radius: 10 },
          Info: {
            y: 24,
            x: 48,
            text: { text: 'Please enter your PIN', fontSize: 32 },
          },
          Msg: {
            y: 260,
            x: 48,
            text: { text: '', fontSize: 28, textColor: 0xffffffff },
          },
          Code: {
            x: 48,
            y: 96,
          },
        },
      }
    }

    _init() {
      const children = [];
      for (let i = 0; i < 4; i++) {
        children.push({
          type: PinInput,
          index: i,
        });
      }

      this.tag('Code').children = children;
    }

    get pin() {
      if (!this._pin) this._pin = '';
      return this._pin
    }

    set pin(v) {
      if (v.length <= 4) {
        const maskedPin = new Array(Math.max(v.length - 1, 0)).fill('*', 0, v.length - 1);
        v.length && maskedPin.push(v.length > this._pin.length ? v.slice(-1) : '*');
        for (let i = 0; i < 4; i++) {
          this.tag('Code').children[i].nr = maskedPin[i] || '';
        }
        this._pin = v;
      }
    }

    get msg() {
      if (!this._msg) this._msg = '';
      return this._msg
    }

    set msg(v) {
      this._timeout && clearTimeout(this._timeout);

      this._msg = v;
      if (this._msg) {
        this.tag('Msg').text = this._msg;
        this.tag('Info').setSmooth('alpha', 0.5);
        this.tag('Code').setSmooth('alpha', 0.5);
      } else {
        this.tag('Msg').text = '';
        this.tag('Info').setSmooth('alpha', 1);
        this.tag('Code').setSmooth('alpha', 1);
      }
      this._timeout = setTimeout(() => {
        this.msg = '';
      }, 2000);
    }

    _firstActive() {
      this.setSmooth('alpha', 1);
    }

    _handleKey(event) {
      if (this.msg) {
        this.msg = false;
      } else {
        const val = parseInt(event.key);
        if (val > -1) {
          this.pin += val;
        }
      }
    }

    _handleBack() {
      if (this.msg) {
        this.msg = false;
      } else {
        if (this.pin.length) {
          this.pin = this.pin.slice(0, this.pin.length - 1);
        } else {
          Pin.hide();
          this.resolve(false);
        }
      }
    }

    _handleEnter() {
      if (this.msg) {
        this.msg = false;
      } else {
        Pin.submit(this.pin)
          .then(val => {
            this.msg = 'Unlocking ...';
            setTimeout(() => {
              Pin.hide();
            }, 1000);
            this.resolve(val);
          })
          .catch(e => {
            this.msg = e;
            this.reject(e);
          });
      }
    }
  }

  /*
   * If not stated otherwise in this file or this component's LICENSE file the
   * following copyright and licenses apply:
   *
   * Copyright 2020 RDK Management
   *
   * Licensed under the Apache License, Version 2.0 (the License);
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  // only used during local development
  let unlocked = false;

  let submit = pin => {
    return new Promise((resolve, reject) => {
      if (pin.toString() === Settings.get('platform', 'pin', '0000').toString()) {
        unlocked = true;
        resolve(unlocked);
      } else {
        reject('Incorrect pin');
      }
    })
  };

  let check = () => {
    return new Promise(resolve => {
      resolve(unlocked);
    })
  };

  let pinDialog = null;

  // Public API
  var Pin = {
    show() {
      return new Promise((resolve, reject) => {
        pinDialog = ApplicationInstance.stage.c({
          ref: 'PinDialog',
          type: PinDialog,
          resolve,
          reject,
        });
        ApplicationInstance.childList.a(pinDialog);
        ApplicationInstance.focus = pinDialog;
      })
    },
    hide() {
      ApplicationInstance.focus = null;
      ApplicationInstance.children = ApplicationInstance.children.map(
        child => child !== pinDialog && child
      );
      pinDialog = null;
    },
    submit(pin) {
      return new Promise((resolve, reject) => {
        try {
          submit(pin)
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      })
    },
    unlocked() {
      return new Promise((resolve, reject) => {
        try {
          check()
            .then(resolve)
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      })
    },
    locked() {
      return new Promise((resolve, reject) => {
        try {
          check()
            .then(unlocked => resolve(!!!unlocked))
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      })
    },
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(l,q,r){l!=Array.prototype&&l!=Object.prototype&&(l[q]=r.value);};$jscomp.getGlobal=function(l){return "undefined"!=typeof window&&window===l?l:"undefined"!=typeof commonjsGlobal&&null!=commonjsGlobal?commonjsGlobal:l};$jscomp.global=$jscomp.getGlobal(commonjsGlobal);
  $jscomp.polyfill=function(l,q,r,a){if(q){r=$jscomp.global;l=l.split(".");for(a=0;a<l.length-1;a++){var b=l[a];b in r||(r[b]={});r=r[b];}l=l[l.length-1];a=r[l];q=q(a);q!=a&&null!=q&&$jscomp.defineProperty(r,l,{configurable:!0,writable:!0,value:q});}};$jscomp.polyfill("Object.is",function(l){return l?l:function(l,r){return l===r?0!==l||1/l===1/r:l!==l&&r!==r}},"es6","es3");
  $jscomp.polyfill("Array.prototype.includes",function(l){return l?l:function(l,r){var a=this;a instanceof String&&(a=String(a));var b=a.length;for(r=r||0;r<b;r++)if(a[r]==l||Object.is(a[r],l))return !0;return !1}},"es7","es3");
  $jscomp.checkStringArgs=function(l,q,r){if(null==l)throw new TypeError("The 'this' value for String.prototype."+r+" must not be null or undefined");if(q instanceof RegExp)throw new TypeError("First argument to String.prototype."+r+" must not be a regular expression");return l+""};$jscomp.polyfill("String.prototype.includes",function(l){return l?l:function(l,r){return -1!==$jscomp.checkStringArgs(this,l,"includes").indexOf(l,r||0)}},"es6","es3");$jscomp.SYMBOL_PREFIX="jscomp_symbol_";
  $jscomp.initSymbol=function(){$jscomp.initSymbol=function(){};$jscomp.global.Symbol||($jscomp.global.Symbol=$jscomp.Symbol);};$jscomp.Symbol=function(){var l=0;return function(q){return $jscomp.SYMBOL_PREFIX+(q||"")+l++}}();
  $jscomp.initSymbolIterator=function(){$jscomp.initSymbol();var l=$jscomp.global.Symbol.iterator;l||(l=$jscomp.global.Symbol.iterator=$jscomp.global.Symbol("iterator"));"function"!=typeof Array.prototype[l]&&$jscomp.defineProperty(Array.prototype,l,{configurable:!0,writable:!0,value:function(){return $jscomp.arrayIterator(this)}});$jscomp.initSymbolIterator=function(){};};$jscomp.arrayIterator=function(l){var q=0;return $jscomp.iteratorPrototype(function(){return q<l.length?{done:!1,value:l[q++]}:{done:!0}})};
  $jscomp.iteratorPrototype=function(l){$jscomp.initSymbolIterator();l={next:l};l[$jscomp.global.Symbol.iterator]=function(){return this};return l};$jscomp.iteratorFromArray=function(l,q){$jscomp.initSymbolIterator();l instanceof String&&(l+="");var r=0,a={next:function(){if(r<l.length){var b=r++;return {value:q(b,l[b]),done:!1}}a.next=function(){return {done:!0,value:void 0}};return a.next()}};a[Symbol.iterator]=function(){return a};return a};
  $jscomp.polyfill("Array.prototype.keys",function(l){return l?l:function(){return $jscomp.iteratorFromArray(this,function(l){return l})}},"es6","es3");
  (function(){var l="SDK_"+"metrological-dev-dcb6662b-202010162041".replace(/[^\w]/g,"_"),q="undefined"!=typeof window?window:"undefined"!=typeof GLOBAL?GLOBAL:this;q.tv=q.tv||{};q.tv.freewheel=q.tv.freewheel||{};q.tv.freewheel[l]=function(l){var a={version:"js-metrological-dev-dcb6662b-202010162041"};"undefined"!==typeof window&&(window._fw_admanager=window._fw_admanager||{},window._fw_admanager.version=a.version);a.LOG_LEVEL_QUIET=0;a.LOG_LEVEL_INFO=1;a.LOG_LEVEL_DEBUG=2;a.setLogLevel=function(b){a.warn=
  a.log=a.debug=function(){};if("undefined"!==typeof console){try{window.localStorage&&window.localStorage.getItem("fwLogLevel")&&-1<window.localStorage.getItem("fwLogLevel")&&(b=window.localStorage.getItem("fwLogLevel"));}catch(c){console.warn(">FW Common.setLogLevel"+c.description);}b>a.LOG_LEVEL_QUIET&&(a.log=function(){console.log(">FW "+(new Date).toISOString().substr(14,9)+" "+Array.prototype.slice.call(arguments).join(" "));},a.warn=function(){console.warn(">FW "+(new Date).toISOString().substr(14,
  9)+" "+Array.prototype.slice.call(arguments).join(" "));},b>a.LOG_LEVEL_INFO&&(a.debug=function(){console.log(">FW "+(new Date).toISOString().substr(14,9)+" "+Array.prototype.slice.call(arguments).join(" "));}));}};a.setLogLevel(a.LOG_LEVEL_INFO);a.log("FreeWheel Integration Runtime",a.version);a.proxyUrl=null;a.creativesProxyUrl=null;a.proxyAuthenticationParameter=null;a.setProxy=function(b){a.debug("setProxy: "+b);a.Util.isValidProxyUrl(b)&&(a.proxyUrl="/"!==b.charAt(b.length-1)?b+"/":b);};a.setCreativesProxy=
  function(b){a.debug("setCreativesProxy: "+b);a.Util.isValidProxyUrl(b)&&(a.creativesProxyUrl="/"!==b.charAt(b.length-1)?b+"/":b);};a.setProxyAuthenticationParameter=function(b,c){a.proxyAuthenticationParameter=2<=arguments.length&&b?{key:b,value:c||""}:null;};a.checkUserAgent=function(b){a.PLATFORM_IS_WINDOWSPHONE=-1<b.search("windows phone");a.PLATFORM_IS_IPAD=-1<b.search("ipad");a.PLATFORM_IS_IPHONE_IPOD=-1<b.search("iphone")||-1<b.search("ipod");a.PLATFORM_IS_CHROMECAST=-1<b.search("crkey");var c=
  function(a){return (a=b.match(a))&&0<a.length?(a=a[0].match(/\d+/g),1*a[0]+.1*(1<a.length?a[1]:0)):0};a.PLATFORM_IE_MOBILE_VERSION=c(/iemobile\/\d+\.\d+/);a.PLATFORM_IOS_VERSION=c(/os \d+_\d+/);a.PLATFORM_ANDROID_VERSION=function(){if(-1<b.indexOf("transformer"))return 3.2;var a=c(/android \d+\.\d+/);return 0!==a?a:c(/android \d+/)}();a.PLATFORM_IS_SAFARI=0<a.PLATFORM_IOS_VERSION&&-1<b.search("applewebkit")||0===a.PLATFORM_ANDROID_VERSION&&0>b.search("chrome")&&-1<b.search("safari");a.PLATFORM_IS_CHROME=
  0>b.search("edge")&&-1<b.search("chrome");a.PLATFORM_IS_FIREFOX=-1<b.search("firefox");a.PLATFORM_IS_MOBILE=0<a.PLATFORM_IOS_VERSION||0<a.PLATFORM_ANDROID_VERSION;a.PLATFORM_BROWSER_VERSION=function(a){var b="",c;-1!==(c=a.indexOf("opr/"))?b=a.substring(c+4):-1!==(c=a.indexOf("opera"))?(b=a.substring(c+6),-1!==(c=a.indexOf("version"))&&(b=a.substring(c+8))):-1!==(c=a.indexOf("rv:"))?b=a.substring(c+3):-1!==(c=a.indexOf("msie"))?b=a.substring(c+5):-1!==(c=a.indexOf("edge"))?b=a.substring(c+5):-1!==
  (c=a.indexOf("chrome"))?b=a.substring(c+7):-1!==(c=a.indexOf("safari"))?(b=a.substring(c+7),-1!==(c=a.indexOf("version"))&&(b=a.substring(c+8))):-1!==(c=a.indexOf("firefox"))?b=a.substring(c+8):a.lastIndexOf(" ")+1<(c=a.lastIndexOf("/"))&&(b=a.substring(c+1));var d;-1!==(d=b.indexOf(";"))&&(b=b.substring(0,d));-1!==(d=b.indexOf(" "))&&(b=b.substring(0,d));return (a=parseInt(""+b,10))?a:0}(b);a.PLATFORM_ID=a.PLATFORM_IS_MOBILE?0<a.PLATFORM_ANDROID_VERSION?"Android"+a.PLATFORM_ANDROID_VERSION:a.PLATFORM_IS_IPAD?
  "iPad"+a.PLATFORM_IOS_VERSION:a.PLATFORM_IS_IPHONE_IPOD?"iPhone"+a.PLATFORM_IOS_VERSION:"UnknownMobile":"Desktop";a.log("Device:",a.PLATFORM_ID,"PLATFORM_IS_SAFARI:",a.PLATFORM_IS_SAFARI,"PLATFORM_IS_CHROME:",a.PLATFORM_IS_CHROME);};a.checkUserAgent(navigator.userAgent.toLowerCase());a.PLATFORM_EVENT_CLICK=a.PLATFORM_IS_MOBILE?"touchend":"click";a.MOBILE_EVENT_DRAG="touchmove";a.PLATFORM_SEND_REQUEST_BY_FORM=!1;a.PLATFORM_SEND_REQUEST_BY_JS=!1;a.PLATFORM_HIDE_AND_SHOW_CONTENT_VIDEO_BY_MOVE_POSITION=
  3.1<=a.PLATFORM_ANDROID_VERSION;a.PLATFORM_HIDE_AND_SHOW_CONTENT_VIDEO_BY_SET_DISPLAY=!0;a.PLATFORM_SUPPORT_PLAY_MIDROLL_BY_CURRENT_VIDEO_ELEMENT=a.PLATFORM_IS_IPAD||a.PLATFORM_IS_IPHONE_IPOD;a.PLATFORM_AUTO_SEEK_AFTER_MIDROLL=a.PLATFORM_IS_IPAD;a.PLATFORM_NOT_SUPPORT_OVERLAY_AD=a.PLATFORM_IS_IPHONE_IPOD||0<a.PLATFORM_ANDROID_VERSION&&3.1>a.PLATFORM_ANDROID_VERSION||a.PLATFORM_IS_WINDOWSPHONE;a.PLATFORM_FILL_VIDEO_POOL_FOR_MIDROLL=4.2<=a.PLATFORM_IOS_VERSION;a.PLATFORM_NOT_SUPPORT_MIDROLL_AD=2.2<=
  a.PLATFORM_ANDROID_VERSION&&3>=a.PLATFORM_ANDROID_VERSION||9<=a.PLATFORM_IE_MOBILE_VERSION;a.PLATFORM_NOT_SUPPORT_VIDEO_AD=0<a.PLATFORM_ANDROID_VERSION&&2.1>=a.PLATFORM_ANDROID_VERSION;a.PLATFORM_DETECT_FULL_SCREEN_FOR_MIDROLL=a.PLATFORM_IS_IPAD&&4.2<=a.PLATFORM_IOS_VERSION;a.PLATFORM_NOT_SUPPORT_CLICK_FOR_VIDEO=a.PLATFORM_IS_IPHONE_IPOD&&10>a.PLATFORM_IOS_VERSION||a.PLATFORM_IS_WINDOWSPHONE||a.PLATFORM_IS_CHROMECAST;a.PLATFORM_NOT_FIRE_CLICK_WHEN_AD_VIDEO_PAUSED=3.1<=a.PLATFORM_ANDROID_VERSION||
  10<=a.PLATFORM_IOS_VERSION;a.PLATFORM_WAIT_WHEN_AD_VIDEO_TIMEOUT=0<a.PLATFORM_ANDROID_VERSION&&3>=a.PLATFORM_ANDROID_VERSION;a.PLATFORM_VIDEO_DOESNOT_SUPPORT_TIMEUPDATE=9<=a.PLATFORM_IE_MOBILE_VERSION;a.PLATFORM_PLAY_DUMMY_VIDEO_FOR_PREROLL=0<a.PLATFORM_IOS_VERSION&&4.2>a.PLATFORM_IOS_VERSION&&4<=a.PLATFORM_IOS_VERSION;a.PLATFORM_NOT_WAIT_FOR_ERROR_WHEN_PLAY_DUMMY_VIDEO_FOR_PREROLL=!1;a.PLATFORM_SUPPORT_VIDEO_START_DETECT_TIMEOUT=0===a.PLATFORM_IOS_VERSION||4<=a.PLATFORM_IOS_VERSION&&4.2>a.PLATFORM_IOS_VERSION;
  a.PLATFORM_NOT_SUPPORT_OVERLAY_CLICK_WHEN_CONTROLS_IS_TRUE=a.PLATFORM_IS_IPAD;a.PLATFORM_BLOCKS_AUTOPLAY=a.PLATFORM_IS_MOBILE||a.PLATFORM_IS_SAFARI||a.PLATFORM_IS_CHROME&&(0<a.PLATFORM_ANDROID_VERSION||64<=a.PLATFORM_BROWSER_VERSION)||a.PLATFORM_IS_FIREFOX&&66<=a.PLATFORM_BROWSER_VERSION;a.PLATFORM_NOT_SUPPORT_DASH=0<a.PLATFORM_IOS_VERSION;a.PLATFORM_HLSJS_MIN_VERSION="0.11.0";a.PLATFORM_DASHJS_SUPPORTED_VERSION="3.0.3";a.CONTEXT_REQUEST_TIMEOUT=5;a.RENDERER_STATE_INIT=1;a.RENDERER_STATE_STARTING=
  2;a.RENDERER_STATE_STARTED=3;a.RENDERER_STATE_COMPLETING=4;a.RENDERER_STATE_COMPLETED=5;a.RENDERER_STATE_FAILED=6;a.TRANSLATOR_STATE_INIT=a.RENDERER_STATE_INIT;a.TRANSLATOR_STATE_STARTING=a.RENDERER_STATE_STARTING;a.TRANSLATOR_STATE_STARTED=a.RENDERER_STATE_STARTED;a.TRANSLATOR_STATE_COMPLETING=a.RENDERER_STATE_COMPLETING;a.TRANSLATOR_STATE_COMPLETED=a.RENDERER_STATE_COMPLETED;a.TRANSLATOR_STATE_FAILED=a.RENDERER_STATE_FAILED;a.EVENT_AD="adEvent";a.EVENT_AD_BUFFERING_START="adBufferingStart";a.EVENT_AD_BUFFERING_END=
  "adBufferingEnd";a.EVENT_SLOT_IMPRESSION="slotImpression";a.EVENT_SLOT_END="slotEnd";a.EVENT_AD_INITIATED="adInitiated";a.EVENT_AD_IMPRESSION="defaultImpression";a.EVENT_AD_IMPRESSION_END="adEnd";a.EVENT_AD_QUARTILE="quartile";a.EVENT_AD_FIRST_QUARTILE="firstQuartile";a.EVENT_AD_MIDPOINT="midPoint";a.EVENT_AD_THIRD_QUARTILE="thirdQuartile";a.EVENT_AD_SKIPPED="adSkipped";a.EVENT_AD_COMPLETE="complete";a.EVENT_AD_CLICK="defaultClick";a.EVENT_AD_MUTE="_mute";a.EVENT_AD_UNMUTE="_un-mute";a.EVENT_AD_COLLAPSE=
  "_collapse";a.EVENT_AD_EXPAND="_expand";a.EVENT_AD_PAUSE="_pause";a.EVENT_AD_RESUME="_resume";a.EVENT_AD_REWIND="_rewind";a.EVENT_AD_ACCEPT_INVITATION="_accept-invitation";a.EVENT_AD_CLOSE="_close";a.EVENT_AD_MINIMIZE="_minimize";a.EVENT_ERROR="_e_unknown";a.EVENT_RESELLER_NO_AD="resellerNoAd";a.EVENT_AD_MEASUREMENT="concreteEvent";a.EVENT_EXTENSION_LOADED="extensionLoaded";a.EVENT_AD_VOLUME_CHANGE="adVolumeChange";a.EVENT_AD_AUTO_PLAY_BLOCKED="videoAutoPlayBlocked";a.INFO_KEY_CUSTOM_ID="customId";
  a.INFO_KEY_MODULE_TYPE="moduleType";a.MODULE_TYPE_EXTENSION="extension";a.MODULE_TYPE_RENDERER="renderer";a.MODULE_TYPE_TRANSLATOR="translator";a.INFO_KEY_ERROR_CODE="errorCode";a.INFO_KEY_ERROR_INFO="errorInfo";a.INFO_KEY_ERROR_MODULE="errorModule";a.INFO_KEY_VAST_ERROR_CODE="vastErrorCode";a.ERROR_IO="_e_io";a.ERROR_TIMEOUT="_e_timeout";a.ERROR_NULL_ASSET="_e_null-asset";a.ERROR_ADINSTANCE_UNAVAILABLE="_e_adinst-unavail";a.ERROR_UNKNOWN="_e_unknown";a.ERROR_MISSING_PARAMETER="_e_missing-param";
  a.ERROR_NO_AD_AVAILABLE="_e_no-ad";a.ERROR_PARSE="_e_parse";a.ERROR_INVALID_VALUE="_e_invalid-value";a.ERROR_INVALID_SLOT="_e_invalid-slot";a.ERROR_NO_RENDERER="_e_no-renderer";a.ERROR_DEVICE_LIMIT="_e_device-limit";a.ERROR_3P_COMPONENT="_e_3p-comp";a.ERROR_UNSUPPORTED_3P_FEATURE="_e_unsupp-3p-feature";a.ERROR_SECURITY="_e_security";a.ERROR_UNMATCHED_SLOT_SIZE="_e_slot-size-unmatch";a.ERROR_DASHJS="_e_dashjs";a.ERROR_HLSJS="_e_hlsjs";a.ERROR_CUSTOM_PLAYER="_e_custom_player";a.INFO_KEY_URL="url";a.INFO_KEY_SHOW_BROWSER=
  "showBrowser";a.INFO_KEY_CUSTOM_EVENT_NAME="customEventName";a.INFO_KEY_NEED_EMPTY_CT="needEmptyCT";a.INFO_KEY_CONCRETE_EVENT_ID="concreteEventId";a.EVENT_TYPE_CLICK_TRACKING="CLICKTRACKING";a.EVENT_TYPE_IMPRESSION="IMPRESSION";a.EVENT_TYPE_CLICK="CLICK";a.EVENT_TYPE_STANDARD="STANDARD";a.EVENT_TYPE_GENERIC="GENERIC";a.EVENT_TYPE_ERROR="ERROR";a.EVENT_VIDEO_VIEW="videoView";a.SHORT_EVENT_TYPE_IMPRESSION="i";a.SHORT_EVENT_TYPE_CLICK="c";a.SHORT_EVENT_TYPE_STANDARD="s";a.SHORT_EVENT_TYPE_ERROR="e";
  a.INIT_VALUE_ZERO="0";a.INIT_VALUE_ONE="1";a.INIT_VALUE_TWO="2";a.INFO_KEY_PARAMETERS="parameters";a.URL_PARAMETER_KEY_ET="et";a.URL_PARAMETER_KEY_CN="cn";a.URL_PARAMETER_KEY_INIT="init";a.URL_PARAMETER_KEY_CT="ct";a.URL_PARAMETER_KEY_METR="metr";a.URL_PARAMETER_KEY_CR="cr";a.URL_PARAMETER_KEY_KEY_VALUE="kv";a.URL_PARAMETER_KEY_ERROR_INFO="additional";a.URL_PARAMETER_KEY_ERROR_MODULE="renderer";a.URL_PARAMETER_KEY_CREATIVE_RENDITION_ID="reid";a.URL_PARAMETER_KEY_CONCRETE_EVENT_ID="creid";a.CAPABILITY_SLOT_TEMPLATE=
  "sltp";a.CAPABILITY_DISPLAY_REFRESH="rfnt";a.CAPABILITY_MULTIPLE_CREATIVE_RENDITIONS="emcr";a.CAPABILITY_RECORD_VIDEO_VIEW="exvt";a.CAPABILITY_CHECK_COMPANION="cmpn";a.CAPABILITY_CHECK_TARGETING="targ";a.CAPABILITY_RESET_EXCLUSIVITY="rste";a.CAPABILITY_FALLBACK_UNKNOWN_ASSET="unka";a.CAPABILITY_FALLBACK_UNKNOWN_SITE_SECTION="unks";a.CAPABILITY_FALLBACK_ADS="fbad";a.CAPABILITY_SLOT_CALLBACK="slcb";a.CAPABILITY_NULL_CREATIVE="nucr";a.CAPABILITY_AUTO_EVENT_TRACKING="aeti";a.CAPABILITY_RENDERER_MANIFEST=
  "rema";a.CAPABILITY_REQUIRE_VIDEO_CALLBACK="vicb";a.CAPABILITY_SKIP_AD_SELECTION="skas";a.SLOT_TYPE_TEMPORAL="temporal";a.SLOT_TYPE_VIDEOPLAYER_NONTEMPORAL="videoPlayerNonTemporal";a.SLOT_TYPE_SITESECTION_NONTEMPORAL="siteSectionNonTemporal";a.TIME_POSITION_CLASS_PREROLL="PREROLL";a.TIME_POSITION_CLASS_MIDROLL="MIDROLL";a.TIME_POSITION_CLASS_POSTROLL="POSTROLL";a.TIME_POSITION_CLASS_OVERLAY="OVERLAY";a.TIME_POSITION_CLASS_DISPLAY="DISPLAY";a.TIME_POSITION_CLASS_PAUSE_MIDROLL="PAUSE_MIDROLL";a.EVENT_REQUEST_INITIATED=
  "onRequestInitiated";a.EVENT_REQUEST_COMPLETE="onRequestComplete";a.EVENT_SLOT_STARTED="onSlotStarted";a.EVENT_SLOT_ENDED="onSlotEnded";a.EVENT_CONTENT_VIDEO_PAUSED="contentVideoPaused";a.EVENT_CONTENT_VIDEO_RESUMED="contentVideoResumed";a.EVENT_CONTENT_VIDEO_PAUSE_REQUEST="contentVideoPauseRequest";a.EVENT_CONTENT_VIDEO_RESUME_REQUEST="contentVideoResumeRequest";a.CAPABILITY_STATUS_OFF=0;a.CAPABILITY_STATUS_ON=1;a.PARAMETER_LEVEL_PROFILE=0;a.PARAMETER_LEVEL_GLOBAL=1;a.PARAMETER_LEVEL_OVERRIDE=5;
  a.PARAMETER_ENABLE_FORM_TRANSPORT="sdk.enableFormTransport";a.PARAMETER_ENABLE_JS_TRANSPORT="sdk.enableJSTransport";a.PARAMETER_DESIRED_BITRATE="desiredBitrate";a.PARAMETER_PAGE_SLOT_CONTENT_TYPE="sdk.pageSlotContentType";a.PARAMETER_EXTENSION_AD_CONTROL_CLICK_ELEMENT="extension.ad.control.clickElement";a.PARAMETER_EXTENSION_CONTENT_VIDEO_ENABLED="extension.contentVideo.enabled";a.PARAMETER_EXTENSION_CONTENT_VIDEO_RESPOND_PAUSE_RESUME="extension.contentVideo.respondPauseResume";a.PARAMETER_EXTENSION_CONTENT_VIDEO_AUTO_SEEK_BACK=
  "extension.contentVideo.autoSeekBack";a.PARAMETER_EXTENSION_CONTENT_VIDEO_AUTO_SOURCE_RESTORE="extension.contentVideo.autoSourceRestore";a.PARAMETER_EXTENSION_VIDEO_STATE_ENABLED="extension.videoState.enabled";a.PARAMETER_RENDERER_VIDEO_START_DETECT_TIMEOUT="renderer.video.startDetectTimeout";a.PARAMETER_RENDERER_VIDEO_PROGRESS_DETECT_TIMEOUT="renderer.video.progressDetectTimeout";a.PARAMETER_RENDERER_VIDEO_ANDROID_DELAY="renderer.video.android.delay";a.PARAMETER_RENDERER_VIDEO_DISPLAY_CONTROLS_WHEN_PAUSE=
  "renderer.video.displayControlsWhenPause";a.PARAMETER_RENDERER_VIDEO_CLICK_DETECTION="renderer.video.clickDetection";a.PARAMETER_RENDERER_VIDEO_PLAY_AFTER_STALLED="renderer.video.playAfterStalled";a.PARAMETER_EXTENSION_SURVEY_ENABLED="extension.survey.enabled";a.PARAMETER_AUTO_PAUSE_AD_ONVISIBILITYCHANGE="autoPauseAdOnVisibilityChange";a.PARAMETER_DISABLE_CORS_ENFORCEMENT="disableCORSEnforcement";a.PARAMETER_ENABLE_ACCESS_CONTROL_ALLOW_CREDENTIALS="enableAccessControlAllowCredentials";a.PARAMETER_RENDERER_DISPLAY_COAD_SCRIPT_NAME=
  "renderer.html.coadScriptName";a.PARAMETER_RENDERER_HTML_SHOULD_BACKGROUND_TRANSPARENT="renderer.html.isBackgroundTransparent";a.PARAMETER_RENDERER_HTML_SHOULD_END_AFTER_DURATION="renderer.html.shouldEndAfterDuration";a.PARAMETER_RENDERER_HTML_AD_LOAD_TIMEOUT="renderer.html.adLoadTimeout";a.PARAMETER_RENDERER_HTML_PLACEMENT_TYPE="renderer.html.placementType";a.PARAMETER_RENDERER_HTML_BOOTSTRAP="renderer.html.bootstrap";a.PARAMETER_RENDERER_HTML_PRIMARY_ANCHOR="renderer.html.primaryAnchor";a.PARAMETER_RENDERER_HTML_MARGIN_WIDTH=
  "renderer.html.marginWidth";a.PARAMETER_RENDERER_HTML_MARGIN_HEIGHT="renderer.html.marginHeight";a.PARAMETER_VPAID_CREATIVE_TIMEOUT_DELAY="renderer.vpaid.creativeTimeoutDelay";a.PARAMETER_VAST_TIMEOUT_IN_MILLISECONDS="translator.vast.timeoutInMilliseconds";a.PARAMETER_VAST_MAX_WRAPPER_COUNT="translator.vast.maxWrapperCount";a.VAST_DEFAULT_MAX_WRAPPER_COUNT=5;a.PARAMETER_RENDERER_HTML_PLACEMENT_TYPE_INTERSTITIAL="interstitial";a.PARAMETER_RENDERER_HTML_BASEUNIT_INTERSTITIAL="app-interstitial";a.PARAMETER_CONSENT_RETRIEVAL_TIMEOUT=
  "consent_retrieval_timeout";a.PARAMETER_USE_GDPR_TCFAPI="useGDPR_TCFAPI";a.PARAMETER_USE_CCPA_USPAPI="useCCPA_USPAPI";a.GDPR_TCFAPI_VERSION=2;a.ID_TYPE_FW=1;a.ID_TYPE_CUSTOM=2;a.ID_TYPE_GROUP=3;a.VIDEO_STATE_PLAYING=1;a.VIDEO_STATE_PAUSED=2;a.VIDEO_STATE_STOPPED=3;a.VIDEO_STATE_COMPLETED=4;a.VIDEO_ASSET_AUTO_PLAY_TYPE_ATTENDED=1;a.VIDEO_ASSET_AUTO_PLAY_TYPE_UNATTENDED=2;a.VIDEO_ASSET_AUTO_PLAY_TYPE_NONE=3;a.VIDEO_ASSET_DURATION_TYPE_EXACT="exact";a.VIDEO_ASSET_DURATION_TYPE_VARIABLE="variable";a.ADUNIT_PREROLL=
  "preroll";a.ADUNIT_MIDROLL="midroll";a.ADUNIT_POSTROLL="postroll";a.ADUNIT_OVERLAY="overlay";a.ADUNIT_STREAM_PREROLL="stream_preroll";a.ADUNIT_STREAM_POSTROLL="stream_postroll";a.SLOT_LOCATION_PLAYER="player";a.SLOT_LOCATION_EXTERNAL="external";a.SLOT_OPTION_INITIAL_AD_STAND_ALONE=0;a.SLOT_OPTION_INITIAL_AD_KEEP_ORIGINAL=1;a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_ONLY=2;a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_STAND_ALONE=3;a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_THEN_STAND_ALONE=4;a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_NO_STAND_ALONE=
  5;a.SLOT_OPTION_INITIAL_AD_NO_STAND_ALONE=6;a.SLOT_OPTION_INITIAL_AD_NO_STAND_ALONE_IF_TEMPORAL=7;a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_NO_STAND_ALONE_IF_TEMPORAL=8;a.REQUEST_MODE_ON_DEMAND="on-demand";a.REQUEST_MODE_LIVE="live";a.MINIMUM_VAST_VERSION_SUPPORTED=2;a.MAXIMUM_VAST_VERSION_SUPPORTED=4;a.ERROR_VAST_XML_PARSING="100";a.ERROR_VAST_SCHEMA_VALIDATION="101";a.ERROR_VAST_VERSION_NOT_SUPPORTED="102";a.ERROR_VAST_TRACKING_ERROR="200";a.ERROR_VAST_LINEARITY_NOT_MATCH="201";a.ERROR_VAST_NO_AD=
  "303";a.ERROR_VAST_WRAPPER_LIMIT_REACH="302";a.ERROR_VAST_URI_TIMEOUT="301";a.ERROR_VAST_GENERAL_LINEAR_ERROR="400";a.ERROR_VAST_NON_LINEAR_GENERAL_ERROR="500";a.ERROR_VAST_COMPANION_GENERAL_ERROR="600";a.ERROR_VAST_GENERAL_VPAID_ERROR="901";a.Util={setContext:function(b){a.Util._context=b;},getParameterAccessControlAllowCredentials:function(){if(!a.Util._context)return !1;var b=a.Util._context.getParameter(a.PARAMETER_ENABLE_ACCESS_CONTROL_ALLOW_CREDENTIALS);return !0===a.Util.str2bool(b)},canPlayVideoType:function(b){"video/3gp"===
  b&&(b="video/3gpp");if("video/3gpp"===b&&!a.PLATFORM_IS_SAFARI||a.PLATFORM_IS_SAFARI&&("video/ogg"===b||"video/webm"===b))return !1;if(1<a.PLATFORM_ANDROID_VERSION&&"video/m4v"===b)return !0;var c=document.createElement("video");if(!c.canPlayType)return !1;var d=["application/x-mpegurl","application/vnd.apple.mpegurl","application/x-mpegURL"];return "undefined"!==typeof Hls&&Hls.isSupported()&&d.includes(b)?!0:!(!c.canPlayType(b)&&!c.canPlayType(b.replace("/","/x-")))},str2bool:function(b){if(!b)return !1;
  b=a.Util.trim(b).toLowerCase();return "true"===b||"yes"===b||"on"===b||"1"===b},trim:function(a){return "string"!==typeof a?a.toString():a.replace(/^\s+|\s+$/g,"")},isBlank:function(b){return !b||""===a.Util.trim(b)},encodeToHex:function(a){for(var b="",d=0;d<a.length;d++){for(var e=a.charCodeAt(d).toString(16).toUpperCase();4>e.length;)e="0"+e;b+="\\u"+e.toUpperCase();}return b},forEachOnArray:function(a,c,d){var b;if(null==a)throw new TypeError(" array is null or not defined");a=Object(a);var f=a.length>>>
  0;if("[object Function]"!=={}.toString.call(c))throw new TypeError(c+" is not a function");d&&(b=d);for(d=0;d<f;){if(d in a){var h=a[d];c.call(b,h,d,a);}d++;}},mixin:function(a,c){for(var b in c)"undefined"!==typeof c[b]&&(a[b]=c[b]);return a},copy:function(b){return a.Util.mixin({},b)},bind:function(a,c){var b=c,e=Array.prototype.slice.call(arguments);e.shift();b=e.shift();return function(){return b.apply(a,e.concat(Array.prototype.slice.call(arguments)))}},getObject:function(a,c,d){if(!a)return null;
  a=a.split(".");c=c||window;for(var b=0,f;c&&(f=a[b]);b++)c=f in c?c[f]:d?c[f]={}:void 0;return c},transformToProxy:function(b,c){if(null==b||null==c)return b;c=c.replace("$","$$");b=b.replace(/https?:\/\//,c);a.proxyAuthenticationParameter&&(b=a.Util.setParameterInURL(b,a.proxyAuthenticationParameter.key,a.proxyAuthenticationParameter.value));return b},transformUrlToProxy:function(b){return this.transformToProxy(b,a.proxyUrl)},transformCreativeUrlToProxy:function(b){return this.transformToProxy(b,
  a.creativesProxyUrl)},pingURLWithImage:function(b){(new Image(1,1)).src=a.Util.transformUrlToProxy(b);},pingURLWithForm:function(b,c,d){d=d?"_fw_request":"_fw_cb";null==c&&(c=Math.random());var e=document.createElement("iframe");e.name=d+"_iframe_"+c;e.id=d+"_iframe_"+c;e.style.position="absolute";e.style.left="-10000px";e.style.width="1px";e.style.visibility="hidden";var f=document.createElement("form");f.action=a.Util.transformUrlToProxy(b);f.id=d+"_form_"+c;f.target=e.id;f.method="post";f.style.position=
  "absolute";f.style.left="-10000px";f.style.width="1px";f.style.visibility="hidden";document.body&&(document.body.appendChild(e),document.body.appendChild(f),f.submit(),document.body.removeChild(f));},pingURLWithScript:function(b){var c=document.getElementsByTagName("head")[0],d=document.createElement("script");d.src=a.Util.transformUrlToProxy(b);d.onload=d.onreadystatechange=function(){this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||c.removeChild(d);};c.appendChild(d);},pingURLWithXMLHTTPRequest:function(b){var c=
  new XMLHttpRequest,d=a.Util.transformUrlToProxy(b);c.onload=function(){200===c.status?a.debug("Sent pingback: "+d+". Status: "+c.status):a.warn("Pingback not sent: "+d+". Status: "+c.status);};c.onerror=function(b){a.warn("An error ocurred while trying to send pingback:"+d+". Error: "+b);};c.ontimeout=function(){a.warn("Timeout ocurred while trying to send pingback:"+d);};c.timeout=1E3*a.CONTEXT_REQUEST_TIMEOUT;c.open("GET",d,!0);c.withCredentials=a.Util.getParameterAccessControlAllowCredentials();c.send();},
  extractAdResponseJSONFromXMLHttpRequest:function(b,c){String.prototype.rsplit=function(a,b){var c=this.split(a);return b?[c.slice(0,-b).join(a)].concat(c.slice(-b)):c};try{var d=c.split(".requestComplete(");return d&&0!=d.length?-1>=d[0].indexOf("tv.freewheel.SDK._instanceQueue['Context_"+b+"']")?(a.warn("An error occured while trying to parse the ad response. The callback function is not set correctly."),null):JSON.parse(d[1].rsplit(");",1)[0]):(a.warn("An error occured while trying to parse the ad response."),
  null)}catch(e){return a.warn("An error occured while trying to parse the ad response: "+e),null}},sendAdRequestWithXMLHTTPRequest:function(b){var c=new XMLHttpRequest,d=a.Util.transformUrlToProxy(b);c.onload=function(){if(200===c.status){a.debug("Sent request: "+d+". Status: "+c.status);var b=a.Util.extractAdResponseJSONFromXMLHttpRequest(a.Util._context._instanceId,c.responseText);a.Util._context.requestComplete(b);}else a.warn("Request not sent: "+d+". Status: "+c.status);};c.onerror=function(b){a.warn("An error ocurred while trying to send pingback:"+
  d+". Error: "+JSON.stringify(b));a.Util._context.requestComplete(null);};c.ontimeout=function(){a.warn("Timeout ocurred while trying to send the ad request:"+d);};c.timeout=1E3*a.CONTEXT_REQUEST_TIMEOUT;c.open("GET",d,!0);c.withCredentials=a.Util.getParameterAccessControlAllowCredentials();c.send();},pingURL:function(b){a.debug("send callback: "+b);b&&(a.PLATFORM_SEND_REQUEST_BY_FORM?a.Util.pingURLWithForm(b,null,!1):a.PLATFORM_SEND_REQUEST_BY_JS?a.Util.pingURLWithXMLHTTPRequest(b):a.Util.pingURLWithImage(b));},
  pingURLs:function(b){for(var c=0;c<b.length;c++)a.Util.pingURL(b[c]);},setParameterInURL:function(a,c,d){if(!a||!c||null==d)return null;var b=!1;a=a.split("?");d=encodeURIComponent(d);if(a[1]){var f=a[1].split("&");for(var h=0;h<f.length;++h){var g=f[h].split("=");if(g[0]===c){f[h]=g[0]+"="+d;b=!0;break}}g=f.join("&");b||(g=c+"="+d+"&"+g);}else g=c+"="+d;return g=a[0]+"?"+g},getParameterInURL:function(b,c){if(!b||!c)return null;b=b.split("?");if(b[1]){b=b[1].split("&");for(var d=0;d<b.length;++d){var e=
  b[d].split("=");if(e[0]===c&&!a.Util.isBlank(e[1]))return decodeURIComponent(e[1])}}return null},isParameterInURL:function(a,c){if(!a||!c)return !1;a=a.split("?");if(a[1]){a=a[1].split("&");for(var b=0;b<a.length;++b)if(a[b].split("=")[0]===c)return !0}return !1},flashVersion:function(){var b="0,0,0,0";if(null!=navigator.plugins&&0<navigator.plugins.length){if(navigator.plugins["Shockwave Flash 2.0"]||navigator.plugins["Shockwave Flash"])try{var c=navigator.plugins["Shockwave Flash"+(navigator.plugins["Shockwave Flash 2.0"]?
  " 2.0":"")].description.split(" "),d=c[2].split("."),e=d[0],f=d[1],h=c[3];""===h&&(h=c[4]);"d"===h[0]?h=h.substring(1):"r"===h[0]&&(h=h.substring(1),0<h.indexOf("d")&&(h=h.substring(0,h.indexOf("d"))));b=e+","+f+","+h+",0";}catch(N){a.warn("Flash detection failed on navigator method");}}else try{var g=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");var m=g.GetVariable("$version").split(" ")[1].split(",");3===m.length?b=m.join(",")+",0":4===m.length&&(b=m.join(","));}catch(N){a.warn("Flash detection failed on ActiveX method");}return b},
  xmlToJson:function(b){var c={};if(!b)return null;if(1===b.nodeType){if(0<b.attributes.length){c["@attributes"]={};for(var d=0;d<b.attributes.length;d++){var e=b.attributes.item(d);c["@attributes"][e.nodeName]=e.nodeValue;}}}else 3===b.nodeType?c=b.nodeValue:4===b.nodeType&&(c=b.nodeValue);if(b.hasChildNodes()){for(d=0;d<b.childNodes.length;d++){e=b.childNodes.item(d);var f=e.nodeName;if("undefined"===typeof c[f])c[f]=a.Util.xmlToJson(e);else {if("undefined"===typeof c[f].length||"string"===typeof c[f]){var h=
  c[f];c[f]=[];c[f].push(h);}c[f].push(a.Util.xmlToJson(e));}}"undefined"!==typeof c["#cdata-section"]?(c.value=c["#cdata-section"],c.value.constructor===Array&&(c.value=c.value.join(""))):c["#text"]&&(c.value=c["#text"]);}return c},lazyJavaScriptLoad:function(a,c){var b=document.getElementsByTagName("head")[0]||document.documentElement,e=document.createElement("script");e.type="text/javascript";e.src=a;c&&(e.attachEvent&&!window.opera?e.onreadystatechange=function(){if("loaded"===e.readyState||"complete"===
  e.readyState)b.removeChild(e),e.onreadystatechange=null,c();}:e.addEventListener("load",function(){b.removeChild(e);c();},!1));b.insertBefore(e,b.firstChild);},getViewport:function(){var a=0,c=0;"undefined"!==typeof window.innerWidth?(a=window.innerWidth,c=window.innerHeight):"undefined"!==typeof document.documentElement&&"undefined"!==typeof document.documentElement.clientWidth&&0!==document.documentElement.clientWidth?(a=document.documentElement.clientWidth,c=document.documentElement.clientHeight):
  document.getElementsByTagName("body")&&document.getElementsByTagName("body")[0]&&(a=document.getElementsByTagName("body")[0].clientWidth,c=document.getElementsByTagName("body")[0].clientHeight);return {width:a,height:c,offsetX:window.pageXOffset||document.documentElement.scrollLeft||document.body.scrollLeft,offsetY:window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop}},getAbsoluteUrl:function(b,c){b=a.Util.trim(b);c=a.Util.trim(c);if(-1!==c.indexOf("://"))return c;var d=
  b.substring(0,b.indexOf("://"));if(0===c.indexOf("//"))return d+":"+c;d=b.indexOf("/",b.indexOf("://")+5);var e=b;-1!==d&&(e=b.substring(0,d));if(0===c.indexOf("/"))return e+c;d=b.lastIndexOf("#");e=b;-1!==d&&(e=b.substring(0,d));if(0===c.indexOf("#"))return e+c;e=b.indexOf("?");d=b;-1!==e&&(d=b.substring(0,e));if(0===c.indexOf("?"))return d+c;e=-1===e?b.lastIndexOf("/"):d.lastIndexOf("/");d=-1!==e?b.substring(0,e+1):d+"/";return d+c},secondsToHms:function(a){a=isNaN(Number(a))?0:Number(a);var b=
  Math.floor(a%3600/60),d=Math.round(a%3600%60);return ("0"+Math.floor(a/3600)).slice(-2)+":"+("0"+b).slice(-2)+":"+("0"+d).slice(-2)},getFixedDigitRandomNumber:function(a){a=isNaN(Number(a))?0:Number(a);return Math.floor(9*Math.random()*Math.pow(10,a-1)+Math.pow(10,a-1))},getDateStringInISOFormat:function(a){return a instanceof Date&&!isNaN(a.valueOf())?a.toISOString():null},getTopMostWindow:function(){for(var a=window;a!=top;)if(a.parent.location.href.length)a=a.parent;else throw "Cannot access top most window";
  return a},getFrameAncestor:function(b){for(var c=window,d;!d;){try{c.frames[b]&&(d=c);}catch(e){a.warn("Error while trying to access window with "+b);}if(c===window.top)break;c=c.parent;}return d},isValidProxyUrl:function(a){return a&&"string"===typeof a},compareVersion:function(a,c){if(a===c)return 0;a=a.split(".");c=c.split(".");for(var b=Math.min(a.length,c.length),e=0;e<b;e++){if(parseInt(a[e])>parseInt(c[e]))return 1;if(parseInt(a[e])<parseInt(c[e]))return -1}return a.length>c.length?1:a.length<
  c.length?-1:0},validateJSON:function(a,c,d){var b=Object.keys(c).filter(function(b){return !c[b](a[b])}).map(function(b){return a[b]?b+" is invalid.":b+" is missing."}).reduce(function(a,b){return a+" "+b},"");if(0<b.length)return Error("The "+d+" failed validation:"+b)},validateCustomPlayer:function(a){if(!a)return Error("customPlayer is null");if(a=this.validateJSON(a,{open:function(a){return "function"===typeof a},getDuration:function(a){return "function"===typeof a},getPlayheadTime:function(a){return "function"===
  typeof a},playPause:function(a){return "function"===typeof a}},"customPlayer"))return Error(a.message.replace("invalid","not a function"))}};a.MediaState=function(){};a.MediaState.prototype={};a.MediaState.prototype.constructor=a.MediaState;a.Util.mixin(a.MediaState.prototype,{play:function(b){a.debug(this._name+" play("+b+")");},pause:function(b){a.debug(this._name+" pause("+b+")");},complete:function(b){a.debug(this._name+" complete("+b+")");}});a.MediaInitState=function(){this._name="MediaInitState";};
  a.MediaInitState.prototype=new a.MediaState;a.MediaInitState.prototype.constructor=a.MediaInitState;a.Util.mixin(a.MediaInitState.prototype,{play:function(b){a.debug(this._name+" play("+b+")");b.setMediaState(a.MediaPlayingState.instance);if("function"===typeof b.onStartPlaying)b.onStartPlaying();}});a.MediaInitState.instance=new a.MediaInitState;a.MediaPlayingState=function(){this._name="MediaPlayingState";};a.MediaPlayingState.prototype=new a.MediaState;a.MediaPlayingState.prototype.constructor=a.MediaPlayingState;
  a.Util.mixin(a.MediaPlayingState.prototype,{pause:function(b){a.debug(this._name+" pause("+b+")");b.setMediaState(a.MediaPausedState.instance);if("function"===typeof b.onPausePlaying)b.onPausePlaying();},complete:function(b){a.debug(this._name+" complete("+b+")");b.setMediaState(a.MediaEndState.instance);if("function"===typeof b.onCompletePlaying)b.onCompletePlaying();}});a.MediaPlayingState.instance=new a.MediaPlayingState;a.MediaPausedState=function(){this._name="MediaPausedState";};a.MediaPausedState.prototype=
  new a.MediaState;a.MediaPausedState.prototype.constructor=a.MediaPausedState;a.Util.mixin(a.MediaPausedState.prototype,{play:function(b){a.debug(this._name+" play("+b+")");b.setMediaState(a.MediaPlayingState.instance);if("function"===typeof b.onResumePlaying)b.onResumePlaying();},complete:function(b){a.debug(this._name+" complete("+b+")");b.setMediaState(a.MediaEndState.instance);if("function"===typeof b.onCompletePlaying)b.onCompletePlaying();}});a.MediaPausedState.instance=new a.MediaPausedState;
  a.MediaReplayingState=function(){this._name="MediaReplayingState";};a.MediaReplayingState.prototype=new a.MediaState;a.MediaReplayingState.prototype.constructor=a.MediaReplayingState;a.Util.mixin(a.MediaReplayingState.prototype,{pause:function(b){a.debug(this._name+" pause("+b+")");b.setMediaState(a.MediaReplayPausedState.instance);if("function"===typeof b.onPausePlaying)b.onPausePlaying();},complete:function(b){a.debug(this._name+" complete("+b+")");b.setMediaState(a.MediaEndState.instance);if("function"===
  typeof b.onCompleteReplaying)b.onCompleteReplaying();}});a.MediaReplayingState.instance=new a.MediaReplayingState;a.MediaReplayPausedState=function(){this._name="MediaReplayPausedState";};a.MediaReplayPausedState.prototype=new a.MediaState;a.MediaReplayPausedState.prototype.constructor=a.MediaReplayPausedState;a.Util.mixin(a.MediaReplayPausedState.prototype,{play:function(b){a.debug(this._name+" play("+b+")");b.setMediaState(a.MediaReplayingState.instance);if("function"===typeof b.onResumePlaying)b.onResumePlaying();},
  complete:function(b){a.debug(this._name+" complete("+b+")");b.setMediaState(a.MediaEndState.instance);if("function"===typeof b.onCompleteReplaying)b.onCompleteReplaying();}});a.MediaReplayPausedState.instance=new a.MediaReplayPausedState;a.MediaEndState=function(){this._name="MediaEndState";};a.MediaEndState.prototype=new a.MediaState;a.MediaEndState.prototype.constructor=a.MediaEndState;a.Util.mixin(a.MediaEndState.prototype,{play:function(b){a.debug(this._name+" play("+b+")");b.setMediaState(a.MediaReplayingState.instance);
  if("function"===typeof b.onStartReplaying)b.onStartReplaying();}});a.MediaEndState.instance=new a.MediaEndState;a.RendererState=function(){};a.RendererState.prototype={};a.RendererState.prototype.constructor=a.RendererState;a.Util.mixin(a.RendererState.prototype,{start:function(b){a.debug(this._name+" start() rendererController = "+b);},notifyStarted:function(b){a.debug(this._name+" notifyStarted() rendererController = "+b);},stop:function(b){a.debug(this._name+" stop() rendererController = "+b);},complete:function(b){a.debug(this._name+
  " complete() rendererController = "+b);},notifyCompleted:function(b){a.debug(this._name+" notifyCompleted() rendererController = "+b);},fail:function(b){a.debug(this._name+" fail() rendererController = "+b);b.setRendererState(a.RendererFailedState.instance);b.getAdInstance().complete();}});a.RendererInitState=function(){this._name="RendererInitState";};a.RendererInitState.prototype=new a.RendererState;a.RendererInitState.prototype.constructor=a.RendererInitState;a.RendererInitState.instance=new a.RendererInitState;
  a.Util.mixin(a.RendererInitState.prototype,{start:function(b){a.debug(this._name+" start()");b.setRendererState(a.RendererStartingState.instance);b.getRenderer().start(b);},stop:function(b){a.debug(this._name+" stop()");b.setRendererState(a.RendererCompletingState.instance);b.getRendererState().notifyCompleted(b);}});a.RendererStartingState=function(){this._name="RendererStartingState";};a.RendererStartingState.prototype=new a.RendererState;a.RendererStartingState.prototype.constructor=a.RendererStartingState;
  a.RendererStartingState.instance=new a.RendererStartingState;a.Util.mixin(a.RendererStartingState.prototype,{notifyStarted:function(b){a.debug(this._name+" notifyStarted()");b.setRendererState(a.RendererStartedState.instance);b.getAdInstance().play();},stop:function(b){a.debug(this._name+" stop()");"function"===typeof b.getRenderer().stop&&(b.setRendererState(a.RendererCompletingState.instance),b.getRenderer().stop());}});a.RendererStartedState=function(){this._name="RendererStartedState";};a.RendererStartedState.prototype=
  new a.RendererState;a.RendererStartedState.prototype.constructor=a.RendererStartedState;a.RendererStartedState.instance=new a.RendererStartedState;a.Util.mixin(a.RendererStartedState.prototype,{complete:function(b){a.debug(this._name+" complete()");b.setRendererState(a.RendererCompletingState.instance);},stop:function(b){a.debug(this._name+" stop()");"function"===typeof b.getRenderer().stop&&(b.setRendererState(a.RendererCompletingState.instance),!1===b.getRenderer().stop()&&b.getAdInstance().fakeComplete());}});
  a.RendererCompletingState=function(){this._name="RendererCompletingState";};a.RendererCompletingState.prototype=new a.RendererState;a.RendererCompletingState.prototype.constructor=a.RendererCompletingState;a.RendererCompletingState.instance=new a.RendererCompletingState;a.Util.mixin(a.RendererCompletingState.prototype,{notifyCompleted:function(b){a.debug(this._name+" notifyCompleted()");b.setRendererState(a.RendererCompletedState.instance);b.getAdInstance().complete();}});a.RendererCompletedState=function(){this._name=
  "RendererCompletedState";};a.RendererCompletedState.prototype=new a.RendererState;a.RendererCompletedState.prototype.constructor=a.RendererCompletedState;a.RendererCompletedState.instance=new a.RendererCompletedState;a.RendererFailedState=function(){this._name="RendererFailedState";};a.RendererFailedState.prototype=new a.RendererState;a.RendererFailedState.prototype.constructor=a.RendererFailedState;a.RendererFailedState.instance=new a.RendererFailedState;a.HTMLRenderer=function(){this._rendererController=
  null;};a.HTMLRenderer.prototype={start:function(b){this._rendererController=b;this._rendererController.getAdInstance().getSlot().getBase()?this._setupParameters()&&(this._render(),this._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED)):this._onRendererFailed(a.ERROR_INVALID_SLOT,"slot base is empty");},pause:function(){this.log("pause");this.shouldEndAfterDuration&&this.timer&&this.timer.pause();},resume:function(){this.log("resume");this.shouldEndAfterDuration&&this.timer&&this.timer.start();},
  stop:function(){this.log("stop isMRAIDAd:"+this.isMRAIDAd+" tpc:"+this._tpc+" interstitial:"+this.shouldKeepInterstitial);return this._stop()},_stop:function(){this.log("_stop isMRAIDAd:"+this.isMRAIDAd+" tpc:"+this._tpc+" interstitial:"+this.shouldKeepInterstitial);if(this.isMRAIDAd||this._tpc!==a.TIME_POSITION_CLASS_DISPLAY||this.shouldKeepInterstitial)this._cleanup(),this._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED);else return !1},resize:function(){var b=this._rendererController.getAdInstance(),
  c=b.getSlot().getBase();b.getSlot().getTimePositionClass()===a.TIME_POSITION_CLASS_OVERLAY?!this.isMRAIDAd||this.isMRAIDAd&&this.mraid.state===this.mraid.STATEDEFAULT?(b="_fw_ad_container_html_"+b.getSlot().getCustomId()+"_",b=document.getElementById(b),b.style.width=c.style.width||"100%",b.style.height=c.style.height||"100%",this._layoutOverlayAd(this.defaultAdElement)):this.log("Cannot resize an MRAID ad that is not in the default state"):this.log("Cannot resize a non-overlay ad");},_cleanup:function(){this.log("_cleanup");
  this.timer&&(this.timer.stop(),this.timer=null);this.adLoadTimeoutTimer&&(this.adLoadTimeoutTimer.stop(),this.adLoadTimeoutTimer=null);window.removeEventListener?(document.removeEventListener("touchmove",this.touchMoveDisabler,!1),window.removeEventListener("message",this.messageHandlerFunc,!1),window.removeEventListener("resize",this.viewportChangeFunc,!1),window.removeEventListener("scroll",this.viewportChangeFunc,!1)):window.detachEvent&&(window.detachEvent("onmessage",this.messageHandlerFunc),
  window.detachEvent("onresize",this.viewportChangeFunc),window.detachEvent("onscroll",this.viewportChangeFunc));if(this.isMRAIDAd&&(this.mraid.inExpandedState()&&(this.log("stopping with expanded state, invoke close()"),this._mraidClose()),this.mraid.inDefaultState())){this.log("stopping with default state, invoke close()");this._mraidClose();return}if(this.expandedAdElement){var a=this.expandedAdElement.parentNode;this.expandedAdElement._fw_closeButton&&a.removeChild(this.expandedAdElement._fw_closeButton);
  a.removeChild(this.expandedAdElement);this.expandedAdElement===this.defaultAdElement&&(this.defaultAdElementContainer===this.defaultAdElement&&(this.defaultAdElementContainer=null),this.defaultAdElement=null);this.expandedAdElement=null;}this.expandedLightbox&&(a=this.expandedLightbox.parentNode,a.removeChild(this.expandedLightbox),this.expandedLightbox=null);if(this.defaultAdElement){a=this.defaultAdElement.parentNode;var c=this.defaultAdElement;c.style.display="none";a!==this._rendererController.getAdInstance().getSlot().getBase()&&
  window.setTimeout(function(){for(var b=a&&a.childNodes||[],e=0;e<b.length;e++){var f=b[e];f===c&&a.removeChild(f);}},200);this.defaultAdElementContainer===this.defaultAdElement&&(this.defaultAdElementContainer=null);this.defaultAdElement=null;}this.defaultAdElementContainer&&(a=this.defaultAdElementContainer.parentNode,a.removeChild(this.defaultAdElementContainer),this.defaultAdElementContainer=null);(this.shouldPauseContentWhenStart||this.isInterstitialNow&&!this.isMRAIDAd)&&this._rendererController.requestContentStateChange(!1);},
  _setupParameters:function(){var b=this._rendererController.getAdInstance(),c=b.getSlot().getTimePositionClass();this._tpc=c;var d=b.getActiveCreativeRendition();b=d.getBaseUnit();d=d.getCreativeApi();var e;if(a.PLATFORM_NOT_SUPPORT_OVERLAY_AD&&c===a.TIME_POSITION_CLASS_OVERLAY)return this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"Overlay not supported on this device."),!1;if(a.PLATFORM_NOT_SUPPORT_MIDROLL_AD&&(c===a.TIME_POSITION_CLASS_MIDROLL||c===a.TIME_POSITION_CLASS_PAUSE_MIDROLL))return this._onRendererFailed(a.ERROR_DEVICE_LIMIT,
  "Midroll, pause_midroll not supported on this device."),!1;if(a.PLATFORM_IS_IPHONE_IPOD)switch(c){case a.TIME_POSITION_CLASS_MIDROLL:case a.TIME_POSITION_CLASS_PAUSE_MIDROLL:case a.TIME_POSITION_CLASS_OVERLAY:return this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"Midroll, pause_midroll and overlay ads are not supported on iPod, iPhone."),!1;case a.TIME_POSITION_CLASS_PREROLL:case a.TIME_POSITION_CLASS_POSTROLL:this._rendererController.setCapability(a.EVENT_AD_CLICK,a.CAPABILITY_STATUS_OFF);}this.adLoadTimeout=
  5;if(e=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_AD_LOAD_TIMEOUT))this.adLoadTimeout=0<Number(e)?Number(e):this.adLoadTimeout;this.shouldKeepInterstitial=!1;(e=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_PLACEMENT_TYPE))?this.shouldKeepInterstitial=e===a.PARAMETER_RENDERER_HTML_PLACEMENT_TYPE_INTERSTITIAL:"string"===typeof b&&(this.shouldKeepInterstitial=b.toLowerCase()===a.PARAMETER_RENDERER_HTML_BASEUNIT_INTERSTITIAL);this.isInterstitialNow=this.shouldKeepInterstitial;
  this.shouldPauseContentWhenStart=!1;this.shouldPauseContentWhenExpandOrClick=!this.shouldKeepInterstitial&&(c===a.TIME_POSITION_CLASS_DISPLAY||c===a.TIME_POSITION_CLASS_OVERLAY);this.shouldBackgroundTransparent=!1;e=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_SHOULD_BACKGROUND_TRANSPARENT);"undefined"!==typeof e&&null!=e&&(this.shouldBackgroundTransparent=a.Util.str2bool(e));this.shouldEndAfterDuration=c!==a.TIME_POSITION_CLASS_DISPLAY||this.shouldKeepInterstitial;e=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_SHOULD_END_AFTER_DURATION);
  "undefined"!==typeof e&&null!=e&&(this.shouldEndAfterDuration=a.Util.str2bool(e));this.coadScriptName=this._rendererController.getParameter(a.PARAMETER_RENDERER_DISPLAY_COAD_SCRIPT_NAME);this.coadScriptName||(this.coadScriptName=this._rendererController.getParameter("coad_script_name"));this.primaryAnchor=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_PRIMARY_ANCHOR)||"bc";this.marginWidth=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_MARGIN_WIDTH)||0;this.marginHeight=
  this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_MARGIN_HEIGHT)||0;this.bootstrap=this._rendererController.getParameter(a.PARAMETER_RENDERER_HTML_BOOTSTRAP);b=a.Util.getViewport();this.defaultExpandWidth=b.width;this.defaultExpandHeight=b.height;this.isMRAIDAd="MRAID-1.0"===d;this.mraid=new function(b){this.STATELOADING="loading";this.STATEDEFAULT="default";this.STATEEXPANDED="expanded";this.STATEHIDDEN="hidden";this._renderer=b;this._state=this.STATELOADING;this._useCustomClose=!1;
  this.viewable=this.expandIsModal=!0;this._baseUrlExpanded=this._baseUrlDefault="";b=Object.defineProperty||function(a,b,c){c.get&&a.__defineGetter__(b,c.get);c.set&&a.__defineSetter__(b,c.set);};b(this,"baseUrl",{get:function(){return this.inExpandedState()?this._baseUrlExpanded||this._baseUrlDefault:this._baseUrlDefault},set:function(a){this.inExpandedState()?this._baseUrlExpanded=a:(this._baseUrlDefault=a,this._baseUrlExpanded="");}});b(this,"useCustomClose",{get:function(){return this._useCustomClose},
  set:function(a){this._useCustomClose===!a&&(this._useCustomClose=!!a,this.pushData());}});b(this,"placementType",{get:function(){return this._renderer.shouldKeepInterstitial?"interstitial":"inline"}});b(this,"expandWidth",{get:function(){return this._renderer.requestedExpandWidth&&this._renderer.requestedExpandWidth<this._renderer.defaultExpandWidth?this._renderer.requestedExpandWidth:this._renderer.defaultExpandWidth}});b(this,"expandHeight",{get:function(){return this._renderer.requestedExpandHeight&&
  this._renderer.requestedExpandHeight<this._renderer.defaultExpandHeight?this._renderer.requestedExpandHeight:this._renderer.defaultExpandHeight}});b(this,"state",{get:function(){return this._state},set:function(b){this.log("mraid.state change "+this.state+" => "+b);this.state!==b&&(this._renderer.shouldPauseContentWhenExpandOrClick&&(b===this.STATEEXPANDED?this._renderer._rendererController.requestContentStateChange(!0):this.inExpandedState()&&this._renderer._rendererController.requestContentStateChange(!1)),
  b===this.STATEEXPANDED?(this._renderer.expandedAdElement?this._renderer._rendererController.processEvent({name:a.EVENT_AD_ACCEPT_INVITATION}):(this._renderer.expandedAdElement=this._renderer.defaultAdElement,this._renderer._rendererController.processEvent({name:a.EVENT_AD_EXPAND})),this._renderer.presentInterstitial(),this._renderer.shouldEndAfterDuration&&this._renderer.timer.pause()):b===this.STATEDEFAULT&&(this._renderer.shouldKeepInterstitial?(this._renderer.expandedAdElement=this._renderer.defaultAdElement,
  this._renderer.presentInterstitial()):(this.inExpandedState()&&(this._renderer.expandedAdElement!==this._renderer.defaultAdElement?this._renderer._rendererController.processEvent({name:a.EVENT_AD_CLOSE}):this._renderer._rendererController.processEvent({name:a.EVENT_AD_COLLAPSE})),this._renderer.expandedAdElement=null,this._renderer.presentInline()),this._renderer.shouldEndAfterDuration&&this._renderer.timer&&this._renderer.timer.start()),this._state=b,this.pushData(),b===this.STATEHIDDEN&&this._renderer.stop());}});
  this.inLoadingState=function(){return this.state===this.STATELOADING};this.inDefaultState=function(){return this.state===this.STATEDEFAULT};this.inExpandedState=function(){return this.state===this.STATEEXPANDED};this.inHiddenState=function(){return this.state===this.STATEHIDDEN};this.pushData=function(){var a='mraid._Update("'+this.state+'", '+this.viewable+', "'+this.placementType+'", '+this.expandWidth+", "+this.expandHeight+", "+this.useCustomClose+", "+this.expandIsModal+")";this.log("mraid.pushData: going to invoke on iframe with "+
  a);this._renderer.defaultAdElement?(this._renderer.defaultAdElement.contentWindow.postMessage("fwsdk-bounce:"+a,"*"),this._renderer.expandedAdElement&&this._renderer.expandedAdElement!==this._renderer.defaultAdElement&&this._renderer.expandedAdElement.contentWindow.postMessage("fwsdk-bounce:"+a,"*")):this.warn("_mraidPushData: no iframe suitable to send "+a);};this.log=function(a){this._renderer.log(a);};this.warn=function(a){this._renderer.warn(a);};}(this);this.onLoadFunc=a.Util.bind(this,function(){this.adLoadTimeoutTimer&&
  (this.adLoadTimeoutTimer.stop(),this.adLoadTimeoutTimer=null);this.timer&&this.shouldEndAfterDuration&&this.timer.start();});this.touchMoveDisabler=function(a){a.preventDefault();};this.log("setting parameters, adLoadTimeout: "+this.adLoadTimeout+", isMRAIDAd: "+this.isMRAIDAd+", shouldKeepInterstitial: "+this.shouldKeepInterstitial+", shouldEndAfterDuration: "+this.shouldEndAfterDuration+", shouldPauseContentWhenStart: "+this.shouldPauseContentWhenStart+", shouldPauseContentWhenExpandOrClick: "+this.shouldPauseContentWhenExpandOrClick+
  ", shouldBackgroundTransparent: "+this.shouldBackgroundTransparent+", defaultExpandWidth: "+this.defaultExpandWidth+", defaultExpandHeight: "+this.defaultExpandHeight+", coadScriptName: "+this.coadScriptName+", primaryAnchor: "+this.primaryAnchor+", marginWidth: "+this.marginWidth+", marginHeight: "+this.marginHeight+", bootstrap: "+this.bootstrap);if(!this.shouldKeepInterstitial)!this.isMRAIDAd||a.PLATFORM_IS_IPHONE_IPOD&&c!==a.TIME_POSITION_CLASS_DISPLAY||(this._rendererController.setCapability(a.EVENT_AD_ACCEPT_INVITATION,
  a.CAPABILITY_STATUS_ON),this._rendererController.setCapability(a.EVENT_AD_CLOSE,a.CAPABILITY_STATUS_ON),this._rendererController.setCapability(a.EVENT_AD_COLLAPSE,a.CAPABILITY_STATUS_ON),this._rendererController.setCapability(a.EVENT_AD_EXPAND,a.CAPABILITY_STATUS_ON));else if(c===a.TIME_POSITION_CLASS_OVERLAY)return this._onRendererFailed(a.ERROR_INVALID_SLOT,"Interstitial ad is not supported in overlay slot."),!1;return !0},_render:function(){this.log("_render");var b=this._rendererController.getAdInstance(),
  c=b.getSlot(),d=c.getTimePositionClass(),e=c.getBase(),f=b.getActiveCreativeRendition(),h=f.getDuration(),g=f.getPrimaryCreativeRenditionAsset();b=g.getProxiedUrl();var m=g.getContent();d===a.TIME_POSITION_CLASS_DISPLAY&&(e.innerHTML="");this.timer=new a.Timer(h,a.Util.bind(this,this._stop));if(this.coadScriptName&&"function"===typeof window[this.coadScriptName])this.defaultAdElement=window[this.coadScriptName](m,b,f.getHeight(),f.getWidth(),g.getMimeType(),c.getCustomId()),this.timer&&this.shouldEndAfterDuration&&
  this.timer.start();else if(h=document.createElement("span"),h.id="_fw_ad_container_html_"+c.getCustomId()+"_",h.style.position="relative"===e.style.position?"absolute":"relative",h.style.display="inline-block",h.style.margin="0px",h.style.padding="0px",h.style.width=e.style.width||"100%",h.style.height=e.style.height||"100%",h.style.top=h.style.left="0px",e.appendChild(h),this.defaultAdElementContainer=h,b||m){if("text/html_lit_nowrapper"===f.getContentType()||"text/html_lit_js_wc_nw"===f.getContentType()){if(this.isMRAIDAd||
  this.isInterstitialNow){this._onRendererFailed(a.ERROR_INVALID_VALUE,"");this._stop();return}if(!m){this._onRendererFailed(a.ERROR_NULL_ASSET,"Empty content");this._stop();return}this.defaultAdElement=h;this.defaultAdElement.innerHTML=m;c=this.defaultAdElement.getElementsByTagName("script");var l=document.getElementsByTagName("head")[0];for(e=0;e<c.length;++e)if(c[e].src){var n=document.createElement("script");n.src=c[e].src;c[e].charset&&(n.charset=c[e].charset);c[e].innerHTML&&(n.innerHTML=c[e].innerHTML);
  n.onload=n.onreadystatechange=function(){this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||l.removeChild(n);};l.appendChild(n);}else n=c[e].innerHTML,eval(n);this.presentInline();this.onLoadFunc();return}f=document.createElement("iframe");f.id="_fw_ad_container_iframe_"+c.getCustomId()+"_"+Math.random();f.attachEvent?f.attachEvent("onload",this.onLoadFunc):f.onload=this.onLoadFunc;this.defaultAdElement=f;this.defaultAdElementContainer.appendChild(f);this._fillAdNode(f,b,m);
  this.isMRAIDAd&&(this.adLoadTimeoutTimer=new a.Timer(this.adLoadTimeout,a.Util.bind(this,function(){this._onRendererFailed(a.ERROR_TIMEOUT,"Loading MRAID Ad timed out");d!==a.TIME_POSITION_CLASS_DISPLAY?this.isMRAIDAd&&!this.mraid.inLoadingState()?this._mraidClose():this._stop():this._stop();})),this.adLoadTimeoutTimer.start());}else {this._onRendererFailed(a.ERROR_NULL_ASSET,"Empty URL and empty content");this._stop();return}this.defaultAdElement||(c=e.getElementsByTagName("iframe"))&&0<c.length&&(this.defaultAdElement=
  c[c.length-1]);this.defaultAdElement?(this.defaultAdElement.frameBorder="0",this.shouldBackgroundTransparent&&(this.defaultAdElement.allowTransparency="true",this.defaultAdElement.style["background-color"]="rgba(255,255,255,0)"),this.isInterstitialNow?(this.expandedAdElement=this.defaultAdElement,this.presentInterstitial()):this.presentInline(),this.messageHandlerFunc=a.Util.bind(this,this._onWindowMessageReceived),this.viewportChangeFunc=a.Util.bind(this,function(){this.viewportChangeFuncTimer&&
  window.clearTimeout(this.viewportChangeFuncTimer);this.viewportChangeFuncTimer=window.setTimeout(a.Util.bind(this,this._onViewportResizeScroll),200);}),window.addEventListener?(window.addEventListener("message",this.messageHandlerFunc,!1),window.addEventListener("resize",this.viewportChangeFunc,!1),window.addEventListener("scroll",this.viewportChangeFunc,!1)):window.attachEvent&&(window.attachEvent("onmessage",this.messageHandlerFunc),window.attachEvent("onresize",this.viewportChangeFunc),window.attachEvent("onscroll",
  this.viewportChangeFunc))):this.isMRAIDAd&&(this._onRendererFailed(a.ERROR_UNKNOWN,"Failed to find iframe in slotBase for MRAID ad"),this._stop());},_layoutOverlayAd:function(a){this.log("_layoutOverlayAd");var b=this._rendererController.getAdInstance(),d=b.getSlot(),e=d.getVideoDisplaySize().width;d=d.getVideoDisplaySize().height;var f=b.getActiveCreativeRendition();b=f.getWidth()||240;f=f.getHeight()||50;a.style.width=Math.min(b,e)+"px";a.style.height=Math.min(f,d)+"px";a.style.left=a.style.top=
  a.style.right=a.style.bottom="";switch(this.primaryAnchor){case "tl":case "lt":a.style.top=this.marginHeight+"px";a.style.left=this.marginWidth+"px";break;case "tr":case "rt":a.style.top=this.marginHeight+"px";a.style.right=this.marginWidth+"px";break;case "bl":case "lb":a.style.bottom=this.marginHeight+"px";a.style.left=this.marginWidth+"px";break;case "br":case "rb":a.style.bottom=this.marginHeight+"px";a.style.right=this.marginWidth+"px";break;case "tc":case "ct":a.style.top=this.marginHeight+
  "px";a.style.left=.5*Math.max(0,e-b)+"px";break;case "lm":case "ml":a.style.left=this.marginWidth+"px";a.style.top=.5*Math.max(0,d-f)+"px";break;case "rm":case "mr":a.style.right=this.marginWidth+"px";a.style.top=.5*Math.max(0,d-f)+"px";break;case "mc":case "cm":case "c":case "m":a.style.left=.5*Math.max(0,e-b)+"px";a.style.top=.5*Math.max(0,d-f)+"px";break;default:case "bc":case "cb":a.style.bottom=this.marginHeight+"px",a.style.left=.5*Math.max(0,e-b)+"px";}},_fillAdNode:function(b,c,d){this.log("_fillAdNode, url:"+
  c+", content:"+(d?"<omited>":"<empty>"));if(c)b.src=c;else if(d)b=b.contentWindow?b.contentWindow.document:b.contentDocument.document?b.contentDocument.document:b.contentDocument,b.open(),b.write(d),b.close();else return this._onRendererFailed(a.ERROR_NULL_ASSET,"Empty URL and content"),!1;return !0},presentInline:function(){this.log("presentInline");this.isInterstitialNow=!1;var b=this.defaultAdElement;if(b){var c=this._rendererController.getAdInstance(),d=c.getSlot(),e=d.getTimePositionClass(),f=
  d.getWidth(),h=d.getHeight(),g=d.getVideoDisplaySize().width;d=d.getVideoDisplaySize().height;var m=c.getActiveCreativeRendition();c=m.getWidth();m=m.getHeight();b.scrolling="no";b.style.overflow="hidden";switch(e){case a.TIME_POSITION_CLASS_DISPLAY:b.style.position="";b.style.background=this.shouldBackgroundTransparent?"transparent":"";b.style.left="0px";b.style.top="0px";b.style.width=(c?c:f)+"px";b.style.height=(m?m:h)+"px";break;case a.TIME_POSITION_CLASS_OVERLAY:b.style.position="absolute";b.style.background=
  this.shouldBackgroundTransparent?"transparent":"white";this._layoutOverlayAd(b);break;default:b.style.position="absolute",b.style.background=this.shouldBackgroundTransparent?"transparent":"white",b.style.left="0px",b.style.top="0px",b.style.width=g+"px",b.style.height=d+"px";}}},presentInterstitial:function(){this.log("presentInterstitial, defaultExpandWidth: "+this.defaultExpandWidth+", defaultExpandHeight: "+this.defaultExpandHeight+", this.mraid.expandWidth: "+this.mraid.expandWidth+", this.mraid.expandHeight: "+
  this.mraid.expandHeight+", (Math.max(0, this.defaultExpandWidth - this.mraid.expandWidth) / 2) = "+Math.max(0,this.defaultExpandWidth-this.mraid.expandWidth)/2+", (Math.max(0, this.defaultExpandHeight - this.mraid.expandHeight) / 2) = "+Math.max(0,this.defaultExpandHeight-this.mraid.expandHeight)/2);if(this.expandedAdElement){this.isInterstitialNow=!0;document.addEventListener&&(document.removeEventListener("touchmove",this.touchMoveDisabler,!1),document.addEventListener("touchmove",this.touchMoveDisabler,
  !1));var b=this.expandedAdElement.parentNode;this.expandedLightbox||(this.expandedLightbox=document.createElement("div"),this.expandedLightbox.style.background="black",this.expandedLightbox.style.opacity=.8,this.expandedLightbox.style.position="fixed",this.expandedLightbox.style.top="0px",this.expandedLightbox.style.left="0px",this.expandedLightbox.style.zIndex=this.expandedLightbox.style["z-index"]=9999,b.appendChild(this.expandedLightbox));this.expandedLightbox.style.width=this.defaultExpandWidth+
  "px";this.expandedLightbox.style.height=this.defaultExpandHeight+"px";this.expandedAdElement.frameBorder="0";this.expandedAdElement.scrolling="no";this.expandedAdElement.style.position="fixed";this.expandedAdElement.style.overflow="hidden";this.expandedAdElement.style.top=this.expandedAdElement.top=Math.max(0,this.defaultExpandHeight-this.mraid.expandHeight)/2+"px";this.expandedAdElement.style.left=this.expandedAdElement.left=Math.max(0,this.defaultExpandWidth-this.mraid.expandWidth)/2+"px";this.expandedAdElement.style.width=
  this.expandedAdElement.width=this.mraid.expandWidth+"px";this.expandedAdElement.style.height=this.expandedAdElement.height=this.mraid.expandHeight+"px";this.expandedAdElement.style.zIndex=this.expandedAdElement.style["z-index"]=1E4;this.log("presentInterstitial, expanded ad element size: (top, left, width, height) = ("+this.expandedAdElement.top+", "+this.expandedAdElement.left+", "+this.expandedAdElement.width+", "+this.expandedAdElement.height+")");if(this.isMRAIDAd){var c=this.expandedAdElement._fw_closeButton;
  c||(c=document.createElement("div"),c.addEventListener?c.addEventListener("click",a.Util.bind(this,function(){this._mraidClose();})):c.attachEvent&&c.attachEvent("onclick",a.Util.bind(this,function(){this._mraidClose();})),c.style.position="fixed",c.style.margin="0px",c.style.padding="0px",c.style.width="25px",c.style.height="25px",c.style.zIndex=c.style["z-index"]=10001,b.appendChild(c),this.expandedAdElement._fw_closeButton=c);c.style.top=this.expandedAdElement.style.top;c.style.left=Math.max(0,this.defaultExpandWidth-
  this.mraid.expandWidth)/2+this.mraid.expandWidth-25+"px";c.innerHTML=this.mraid.useCustomClose?0<a.PLATFORM_ANDROID_VERSION?"   ":"":0<a.PLATFORM_ANDROID_VERSION&&3>=a.PLATFORM_ANDROID_VERSION?'<img style="width:25px; height:25px; border:0" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4xJREFUeNrMmjFv2kAUxw/IUAZUw4AqJjIxMAQJ9sIHgDYLUqfSBTowJBudAmOnNCNeAitLyVgxxNlBgk+QTKgb6UQHhr7nniNj8PmM3zk86XQZOPt+ee/e+9+dI4zQms1mGTpsb6EVXH42h/YHmqHrukH17kjAiWvQfYT2gfeH2BjaHfYA9hwqCABkobvik9eI/qkIMYB2A0BPSkG4By44hErrQfvhx0MRn/F/Cy3LwjH0yhfZdRSThOhyCI2FZ/iuRrFYjMxmMyMwCEDc8nB6LSsDTBZg7g4GAYj7ANmI0gpeMDEPTxwDhBRMzAXiGrqv7PgMYTSA+eWZtQACvfCTHbedQzYbu4LwOvHolp3q9TorlUpsuVyyfr/P1us16ezi8TirVqtmP5lMzPcIiuepvc5EHT+4doPIZDImhPV3q9UyX0hl+MxOp2O+I5/Ps1qt5pWat4py1CE7Gm4jnf99Sph9z5Lw9gWf845HhLJjtVqx0WhEDuMGgaElYVdbWYuTDbxGYcwiELreskQiwXK5HFssFmyz2ZBA4PoTrA9nFhtCFnu2PCJdL6bTKYlnCCCYfe4WyGc/I4PCEEK8zD3Cw+rxkPjGDIMp2Rl+otRMDGHZaZRvTQ8yv55RBGEKSwQ5C/IEWRiFEGhnMVj1naCbJa9slk6nVUKg/T2h2iyhZywZ4/RCMplUCWFW+hPBsQ0ZjFMhEEOY9SRKLUv3rRnFEHtFI4nhRPelX1xH2FQYOYjf9EsJ8qQSQqVqth8dkYGI6oQK1awExKvYUQlNL5CFSghq1exiCwQxVEOEAGPEYFPyG2QKniS+CWNTRL05w7DSdf2blX7HYe7siD0ztteRm7B3doQww5c9Ow+vspcKRvHXbrfJBCBBmOH13XdnZe95jcKzJmoVK/KMhPV2JAq/UDG8TgJVCEA3GAlvGG5a61JGpmM4UKtYJ4zEs7fmuu8Qu8vU3xEK12EqlXJV0FZIgTe6QhAOcx/kUEKxYUhVZGX8Oft/sX9sNudz2zHXW13wCm6B71m4F6AiwyuECnhj7mtjxQdUKPcrQdStCELoEZtnNO6ZwiuGU8Xr4wE/HwzgJVDY19T49cOlzA9jsk/EC0iQMQ/cM+9C8MIngOjLDjj0o5oGrzVZBWsBa8TA78Cgnznh3QQe6we9j0cpPnTe1IYG4kgIZR5273mvCdIohg6G6TzI5O32T4ABAPsBS28k7apdAAAAAElFTkSuQmCC">':
  '<img style="width:25px; height:25px; border:0" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAwcHgiIGhlaWdodD0iNDAwcHgiIHZpZXdCb3g9IjAgMCA0MDAgNDAwIiBlbmFibGUtYmFja2dyb3VuZD0ibmV3IDAgMCA0MDAgNDAwIiB4bWw6c3BhY2U9InByZXNlcnZlIj48Y2lyY2xlIGZpbGw9IiM2NjY2NjYiIGN4PSIyMDAuMTM5IiBjeT0iMTk5Ljg2IiByPSIxOTcuODYiLz48cGF0aCBmaWxsPSIjRjBGMEYwIiBzdHJva2U9IiNGMEYwRjAiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgZD0iTTExNC44NjUsMzAzLjY0NGMtNi4yMjYsNi4yMjctMTUuMzYzLDcuMTg2LTIwLjQwNywyLjE0NGwtMC41MjItMC41MjJjLTUuMDQzLTUuMDQzLTQuMDgzLTE0LjE4LDIuMTQ0LTIwLjQwN0wyODQuODYsOTYuMDc4YzYuMjI2LTYuMjI3LDE1LjM2Mi03LjE4NiwyMC40MDUtMi4xNDRsMC41MjIsMC41MjFjNS4wNDMsNS4wNDIsNC4wODMsMTQuMTc5LTIuMTQ0LDIwLjQwOEwxMTQuODY1LDMwMy42NDR6Ii8+PHBhdGggZmlsbD0iI0YwRjBGMCIgc3Ryb2tlPSIjRjBGMEYwIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIGQ9Ik0zMDcuODE5LDI4OC42NjZjNS4xNTMsNS4xNTgsNS4wNDgsMTMuNjI0LTAuMjQxLDE4LjkxMWwwLDBjLTUuMjg4LDUuMjg5LTEzLjc1Miw1LjM5My0xOC45MDksMC4yNEw5MS45MDYsMTExLjA1NWMtNS4xNTYtNS4xNTYtNS4wNDgtMTMuNjIzLDAuMjQtMTguOTFsMCwwYzUuMjktNS4yODksMTMuNzU1LTUuMzk2LDE4LjkxMS0wLjI0MUwzMDcuODE5LDI4OC42NjZ6Ii8+PC9zdmc+">';}this.isMRAIDAd||
  this._rendererController.requestContentStateChange(!0);}},_onWindowMessageReceived:function(b){if(this.defaultAdElement&&(b.source===this.defaultAdElement.contentWindow||this.expandedAdElement&&b.source===this.expandedAdElement.contentWindow)){this.log("_onWindowMessageReceived, event.data:"+b.data+", event.origin:"+b.origin);var c=b.data.toString().split(":");if(c&&2<=c.length&&"fwsdk-invoke"===c[0]){var d=c[1];if((c=c.slice(2))&&0<c.length){for(var e=0;e<c.length;e++)c[e]=decodeURIComponent(c[e]);
  1===c.length&&(c=c[0]);}else c=null;if("iframe_ready"===d){if(this.onLoadFunc&&b.source===this.defaultAdElement.contentWindow&&this.defaultAdElement!==this.expandedAdElement)this.onLoadFunc();c&&(c=a.Util.trim(c))&&this.isMRAIDAd&&(this.mraid.baseUrl=c);this.bootstrap&&b.source.postMessage("fwsdk-bounce:"+this.bootstrap,b.origin);b.source.postMessage('fwsdk-bounce:mraid._messagingModel = "postMessage"',b.origin);this.isMRAIDAd&&(b.source===this.defaultAdElement.contentWindow&&this.shouldPauseContentWhenStart&&
  this._rendererController.requestContentStateChange(!0),this.mraid.inLoadingState()?this.mraid.state=this.mraid.STATEDEFAULT:this.expandedAdElement&&b.source===this.expandedAdElement.contentWindow&&this.mraid.pushData());}else this.isMRAIDAd?this._mraidMethods(d,c):"close"===d&&this._stop();}}},_mraidMethods:function(b,c){if(b&&this.isMRAIDAd)switch(this.log("_mraidMethods("+b+", "+c+")"),b){case "open":"string"===typeof c?this._mraidOpen(c):2<=c.length&&this._mraidOpen(c[0],a.Util.str2bool(c[1]));break;
  case "close":this._mraidClose();break;case "expand":this._mraidExpand(c);break;case "useCustomClose":c&&0<c.length?this.mraid.useCustomClose=a.Util.str2bool(c):this.warn("Invalid parameter to useCustomClose");break;case "setExpandProperties":if(!c)break;this.requestedExpandWidth=Number(c[0]);this.requestedExpandHeight=Number(c[1]);if(!this.requestedExpandWidth||!this.requestedExpandHeight||this.requestedExpandWidth===this.defaultExpandWidth&&this.requestedExpandHeight===this.defaultExpandHeight)this.requestedExpandHeight=
  this.requestedExpandWidth=0;this.mraid.useCustomClose=a.Util.str2bool(c[2]);this.requestedExpandWidth===this.mraid.expandWidth&&this.requestedExpandHeight===this.mraid.expandHeight||this.mraid.pushData();break;case "log":this.log("MRAID log:"+c);break;default:this.warn("Unknown MRAID function call: "+b+" with param:"+c);}},_mraidOpen:function(b,c){this.log("_mraidOpen("+b+"), baseUrl: "+this.mraid.baseUrl+", absolute Url: "+(b=a.Util.getAbsoluteUrl(this.mraid.baseUrl,b)));b&&"string"===typeof b&&0<
  b.length?((c||"undefined"===typeof c)&&window.open(b),this._rendererController.processEvent({name:a.EVENT_AD_CLICK,info:{showBrowser:!1}})):this.warn("_mraidOpen: url required for open");},_mraidClose:function(){this.log("_mraidClose, current state: "+this.mraid.state);if(this.mraid.inExpandedState()){window.removeEventListener&&document.removeEventListener("touchmove",this.touchMoveDisabler,!1);var a=this.expandedAdElement,c=this.expandedAdElement._fw_closeButton;this.expandedAdElement._fw_closeButton=
  null;var d=this.expandedAdElement.parentNode;this.mraid.state=this.mraid.STATEDEFAULT;this.expandedLightbox&&(d.removeChild(this.expandedLightbox),this.expandedLightbox=null);a!==this.defaultAdElement&&(a.style.display="hidden",window.setTimeout(function(){d.removeChild(a);},50));d.removeChild(c);}else this.mraid.inDefaultState()?this.mraid.state=this.mraid.STATEHIDDEN:this.warn("_mraidClose: close() is only valid when in expanded/default state");},_mraidExpand:function(b){this.log("_mraidExpand, current state: "+
  this.mraid.state);if(this.mraid.inDefaultState())if(this.shouldKeepInterstitial)this.warn("_mraidExpand: expand() is only valid for inline ad");else {if(b){var c=document.createElement("iframe"),d=a.Util.getAbsoluteUrl(this.mraid.baseUrl,b);this.shouldBackgroundTransparent&&(c.allowTransparency="true",c.style["background-color"]="rgba(255,255,255,0)");(this.defaultAdElementContainer||this.defaultAdElement.parentNode).appendChild(c);this.expandedAdElement=c;this.log("_mraidExpand("+b+"), baseUrl:"+
  this.mraid.baseUrl+", absolute Url"+d);this._fillAdNode(c,d,null);}this.mraid.state=this.mraid.STATEEXPANDED;this.isInterstitialNow=!0;this._onViewportResizeScroll();}else this.warn("_mraidExpand: expand() is only valid when in default state");},_onViewportResizeScroll:function(){var b=a.Util.getViewport();this.defaultExpandWidth=b.width;this.defaultExpandHeight=b.height;this.isInterstitialNow&&this.presentInterstitial();},log:function(b){var c=this._rendererController.getAdInstance().getSlot();a.log("HTMLRenderer["+
  c+"]\t"+b);},warn:function(b){var c=this._rendererController.getAdInstance().getSlot();a.warn("HTMLRenderer["+c+"]\t"+b);},info:function(){return {moduleType:a.MODULE_TYPE_RENDERER}},getPlayheadTime:function(){return this.timer?this.timer.getPlayheadTime():-1},getDuration:function(){return this.timer?this.timer.getDuration():-1},_onRendererFailed:function(b,c,d){var e={};e[a.INFO_KEY_ERROR_MODULE]="HTMLRenderer";e[a.INFO_KEY_ERROR_CODE]=b;this._rendererController.getAdInstance().getSlot().getTimePositionClass()===
  a.TIME_POSITION_CLASS_OVERLAY?d||(d=a.ERROR_VAST_NON_LINEAR_GENERAL_ERROR):this._rendererController.getAdInstance().getSlot().getTimePositionClass()!==a.TIME_POSITION_CLASS_DISPLAY||d||(d=a.ERROR_VAST_COMPANION_GENERAL_ERROR);d&&(e[a.INFO_KEY_VAST_ERROR_CODE]=d);c&&(e[a.INFO_KEY_ERROR_INFO]=c);this._rendererController.handleStateTransition(a.RENDERER_STATE_FAILED,e);}};a.HTMLRenderer.prototype.constructor=a.HTMLRenderer;a.Timer=function(a,c){this._lastTickDate=new Date;this._duration=a||-1;this._playheadTime=
  -1;this._callback=c;this._state=-1;};a.Timer.prototype={};a.Timer.prototype.constructor=a.Timer;a.Util.mixin(a.Timer.prototype,{tick:function(){var a=new Date,c=Math.round((a.getTime()-this._lastTickDate.getTime())/1E3);this._lastTickDate=a;return c},start:function(){if(0!==this._state){if(2===this._state||-1===this._playheadTime)this._playheadTime=0;this._state=0;this._timeStamp=new Date;this._timeouter&&(window.clearTimeout(this._timeouter),this._timeouter=null);var a=this,c=1E3*(this._duration-
  this._playheadTime);0>c||(this._timeouter=window.setTimeout(function(){a.stop();a._playheadTime=a._duration;a._callback&&a._callback();},c));}},pause:function(){0===this._state&&(this._state=1,this._timeouter&&(window.clearTimeout(this._timeouter),this._timeouter=null),this._playheadTime=(new Date-this._timeStamp)/1E3+this._playheadTime);},stop:function(){this._state=2;this._timeouter&&(window.clearTimeout(this._timeouter),this._timeouter=null);this._playheadTime=(new Date-this._timeStamp)/1E3+this._playheadTime;},
  getPlayheadTime:function(){return 0===this._state?(new Date-this._timeStamp)/1E3+this._playheadTime:this._playheadTime},getCTValue:function(){return (new Date-this._timeStamp)/1E3},getDuration:function(){return this._duration}});a.RendererController=function(b,c){var d=null,e=null,f={},h=a.RendererInitState.instance,g={},m=[],N=0;return {getAdInstance:function(){return c},getContext:function(){return b},getRendererState:function(){return h},processEvent:function(b){var d=b.name;if(d===a.RENDERER_STATE_STARTED||
  d===a.RENDERER_STATE_COMPLETING||d===a.RENDERER_STATE_COMPLETED||d===a.RENDERER_STATE_FAILED)this.handleStateTransition(d,b.info);else {var e=this._inferEventType(d);if(e&&(e===a.EVENT_TYPE_CLICK&&b.info&&b.info[a.INFO_KEY_CUSTOM_EVENT_NAME]&&(d=b.info[a.INFO_KEY_CUSTOM_EVENT_NAME]),d!==a.EVENT_AD_MEASUREMENT||b.info[a.INFO_KEY_CONCRETE_EVENT_ID])){var f=d===a.EVENT_AD_INITIATED||d===a.EVENT_AD_BUFFERING_START||d===a.EVENT_AD_BUFFERING_END||d===a.EVENT_AD_VOLUME_CHANGE||b.info&&b.info.hasOwnProperty("apiOnly")&&
  b.info.apiOnly;c.processEvent(d,e,b.info,f);}}},handleStateTransition:function(b,d){switch(b){case a.RENDERER_STATE_STARTED:h.notifyStarted(this);break;case a.RENDERER_STATE_COMPLETING:h.complete(this);break;case a.RENDERER_STATE_COMPLETED:h.complete(this);h.notifyCompleted(this);break;case a.RENDERER_STATE_FAILED:c.getSlot()._clearScheduledAdInstance();d||(d={});a.warn("FAIL",", FW ErrorModule:",d[a.INFO_KEY_ERROR_MODULE],", FW ErrorCode:",d[a.INFO_KEY_ERROR_CODE],", FW ErrorInfo:",d[a.INFO_KEY_ERROR_INFO],
  ", VAST ErrorCode:",d[a.INFO_KEY_VAST_ERROR_CODE]);(b=c.processEvent(a.EVENT_ERROR,a.EVENT_TYPE_ERROR,d))||a.debug("No EVENT_ERROR callback found");if(d)switch(d[a.INFO_KEY_ERROR_CODE]){case a.ERROR_NO_AD_AVAILABLE:case a.ERROR_PARSE:(b=c.processEvent(a.EVENT_RESELLER_NO_AD,a.EVENT_TYPE_IMPRESSION))||a.debug("No EVENT_RESELLER_NO_AD callback found.");}h.fail(this);break;default:a.debug("Unknown event received",b);}},setCapability:function(a,b){c.setMetr(a,b);},getVersion:function(){return b._adManager.getVersion()},
  getParameter:function(a){if(!a)return null;if(b._overrideLevelParameterDictionary.hasOwnProperty(a))return b._overrideLevelParameterDictionary[a];if(c.getActiveCreativeRendition()&&"undefined"!==typeof c.getActiveCreativeRendition().getParameter(a))return c.getActiveCreativeRendition().getParameter(a);var d=c._creative;return d&&"undefined"!==typeof d.getParameter(a)?d.getParameter(a):"undefined"!==typeof c.getSlot().getParameter(a)?c.getSlot().getParameter(a):b._adResponse._profileParameters.hasOwnProperty(a)?
  b._adResponse._profileParameters[a]:b._globalLevelParameterDictionary.hasOwnProperty(a)?b._globalLevelParameterDictionary[a]:f&&f.hasOwnProperty(a)?f[a]:null},getCompanionSlots:function(){for(var a=[],b=c._companionAdInstances,d=0;d<b.length;d++)b[d].isPlaceholder()&&a.push(b[d].getSlot());return a},createNullDrivingAdInstance:function(){var a=c.getSlot().scheduleAdInstance();a.addCreativeRendition().setContentType("null/null");return a},scheduleAdInstances:function(a){var b,d=[],e=null;a=a||[];if(0===
  a.length)return d;for(b=0;b<a.length;b++)a[b].getCustomId()===c.getSlot().getCustomId()&&(e=c.getSlot().scheduleAdInstance());if(!e)if(this.isTranslator())e=this.createNullDrivingAdInstance();else if(this.isRenderer())e=c;else return d;for(var f=0;f<a.length;f++){if(a[f].getCustomId()===c.getSlot().getCustomId())e!==c&&d.push(e);else for(var h=0,n=e._companionAdInstances;h<n.length;h++)if(b=n[h],a[f]===b.getSlot()){if(this.isTranslator())d.push(b);else if(this.isRenderer()&&b.isPlaceholder()){var l=
  b.cloneForTranslation();e===c&&(g[l]=b);n[h]=l;d.push(l);m.push(l);}break}d.length<=f&&d.push(null);}return d},commitAdInstance:function(){if(this.isRenderer()&&c.isStarted()){for(var b=0;b<m.length;b++){var d=m[b];d&&d.getSlot().playCompanionAds(d);}m=[];}else a.warn("Skipping RendererController.commitAdInstance when called with driving ad not started or completed.");},isRenderer:function(){return d&&a.MODULE_TYPE_RENDERER===d.info()[a.INFO_KEY_MODULE_TYPE]},isTranslator:function(){return d&&a.MODULE_TYPE_TRANSLATOR===
  d.info()[a.INFO_KEY_MODULE_TYPE]},playable:function(){return h===a.RendererInitState.instance},reset:function(){h=a.RendererInitState.instance;},play:function(){for(var a=c.getRenderableCreativeRenditions()||[],b=null,d=0;d<a.length;d++){var e=a[d];if(b=this._matchRendererClassName(e)){c.setActiveCreativeRendition(e);break}}0===N&&this._actualPlay(b);},_actualPlay:function(b){(e=a.Util.getObject(b)||a.Util.getObject(l+"."+b))&&(d=new e);d?h.start(this):this.handleStateTransition(a.RENDERER_STATE_FAILED,
  {errorCode:a.ERROR_NO_RENDERER,errorInfo:"Renderer class <"+b+"> not found"});},dispatchEvent:function(a,c){b.dispatchEvent(a,c);},requestContentStateChange:function(a){a?b._requestContentVideoToPauseBySlot(c.getSlot()):b._requestContentVideoToResumeBySlot(c.getSlot());},getRenderer:function(){return d},setRenderer:function(a){d=a;},setRendererState:function(a){h=a;},getContentVideoElement:function(){return b.getContentVideoElement()},getCustomPlayer:function(){return b.getCustomPlayer()},_restorePlaceholdersForHybrid:function(){if(g&&
  this.isRenderer()){for(var a=[],b=0;b<c._companionAdInstances.length;b++){var d=c._companionAdInstances[b],e=g[d];e?a.push(e):a.push(d);}c._companionAdInstances=a;}0<m.length&&this.isRenderer()&&(m=[]);},rendererMatch:function(b){return e?e===a.Util.getObject(this._matchRendererClassName(b)):!0},_matchRendererClassName:function(d){function e(b,c,d){a.debug("matching "+b+" within "+c);if(!c)return !0;c=c.split(",");c[c.length-1]||c.pop();if(d){b=b.toLowerCase();for(d=0;d<c.length;d++)if(b===c[d].toLowerCase())return !0;
  a.debug("not match");return !1}(c=0<=c.indexOf(b))||a.debug("not match");return c}var g=d.getPrimaryCreativeRenditionAsset().getContentType(),h=d.getContentType(),m=d.getWrapperType(),k=d.getCreativeApi(),n=d.getBaseUnit(),r=c.getSoAdUnit(),q=c.getSlot(),P=q.getType();q=q.getTimePositionClass();a.debug("match renderer for creativeRendition:"+d.getId());a.debug("slot type:"+P);if(a.Util.isBlank(h)&&a.Util.isBlank(m))return a.warn("renderer not match due to both contentType and wrapperType are empty"),
  null;var w=b._rendererManifest["*"];w||(w=b._rendererManifest[m]);w||(w=b._rendererManifest[h]);if(!w){P=b._overriddenAdRenderers.concat(b._adResponse._adRenderers);for(var L=0;L<P.length;L++){var t=P[L],C=!t.contentType;C||(m?C=e(m,t.contentType,!0):(g&&(C=e(g,t.contentType,!0)),C||(C=e(h,t.contentType,!0))));if(C)if((C=!t.creativeApi)||(C=e(k,t.creativeApi)),C)if(t.baseUnit&&!e(n,t.baseUnit))a.debug("can't match renderer "+t.url+" due to baseUnit not match for creativeRendition:"+d.getId());else if(t.soAdUnit&&
  !e(r,t.soAdUnit))a.debug("can't match renderer "+t.url+" due to soAdUnit not match for creativeRendition:"+d.getId());else if(t.slotType&&!e(q.toUpperCase(),t.slotType.toUpperCase()))a.debug("can't match renderer "+t.url+" due to slotType not match for creativeRendition:"+d.getId());else if("class://DashRenderer"===t.url&&void 0===window.tv.freewheel.Dashjs)a.debug("can't match renderer "+t.url+" due to missing tv.freewheel.Dash.js for creativeRendition:"+d.getId());else {if(a.debug("renderer "+t.url+
  " matched for creativeRendition:"+d.getId()),t.url){w=t.url;d=w.indexOf("?");-1!==d&&(w=w.substring(0,d));d=w.lastIndexOf("/");-1!==d&&(w=w.substring(d+1));d=w.lastIndexOf(".js");-1!==d&&(w=w.substring(0,d));var E={};if(t.parameter)for(d=[].concat(t.parameter),g=0;g<d.length;g++)if(d[g].hasOwnProperty("name"))E[d[g].name]=d[g].value;else for(var x in d[g])d[g].hasOwnProperty(x)&&(E[x]=d[g][x]);a.Util.getObject(l+"."+w)&&(w=l+"."+w);if(a.Util.getObject(w))f=E,N=0;else {if(0<N)break;var v=this;x=1*this.getContext().getParameter("moduleLoadTimeout")||
  6E4;N=window.setTimeout(function(){N=-1;v.handleStateTransition(a.RENDERER_STATE_FAILED,{errorCode:a.ERROR_NO_RENDERER,errorInfo:"Load renderer timeout, URL:"+t.url});},x);a.Util.lazyJavaScriptLoad(t.url,function(){a.log("async load renderer successful, URL:"+t.url);-1===N?a.debug("renderer loaded after timeout. WILL NOT PLAY."):(window.clearTimeout(N),N=0,f=E,v._actualPlay(w));});}break}}else a.debug("can't match renderer "+t.url+" due to creative api not match for creativeRendition:"+d.getId());else a.debug("can't match renderer "+
  t.url+" due to contentType not match for creativeRendition:"+d.getId());}}return w?w:a.Util.isBlank(m)?"null/null"===h?l+".NullRenderer":null:null},_inferEventType:function(b){return b===a.EVENT_ERROR?a.EVENT_TYPE_ERROR:b===a.EVENT_AD_CLICK?a.EVENT_TYPE_CLICK:b===a.EVENT_AD_IMPRESSION||b===a.EVENT_AD_FIRST_QUARTILE||b===a.EVENT_AD_MIDPOINT||b===a.EVENT_AD_THIRD_QUARTILE||b===a.EVENT_AD_COMPLETE||b===a.EVENT_RESELLER_NO_AD?a.EVENT_TYPE_IMPRESSION:b===a.EVENT_AD_PAUSE||b===a.EVENT_AD_RESUME||b===a.EVENT_AD_REWIND||
  b===a.EVENT_AD_MUTE||b===a.EVENT_AD_UNMUTE||b===a.EVENT_AD_COLLAPSE||b===a.EVENT_AD_EXPAND||b===a.EVENT_AD_MINIMIZE||b===a.EVENT_AD_CLOSE||b===a.EVENT_AD_ACCEPT_INVITATION?a.EVENT_TYPE_STANDARD:b===a.EVENT_AD_MEASUREMENT||b===a.EVENT_AD_VOLUME_CHANGE||b===a.EVENT_AD_BUFFERING_START||b===a.EVENT_AD_BUFFERING_END||a.EVENT_AD_INITIATED||a.EVENT_AD_AUTO_PLAY_BLOCKED?a.EVENT_TYPE_GENERIC:null},pause:function(){a.log("RendererController.pause");d&&"function"===typeof d.pause?d.pause():a.log("Renderer.pause() is not implemented.");},
  resume:function(){a.log("RendererController.resume");d&&"function"===typeof d.resume?d.resume():a.log("Renderer.resume() is not implemented.");},stop:function(){a.log("RendererController.stop");0<N&&(N=-1);h.stop(this);}}};a.VideoStateExtension=function(){};a.VideoStateExtension.prototype={_enabled:function(){if(null==this._context)return !1;var b=this._context.getParameter(a.PARAMETER_EXTENSION_VIDEO_STATE_ENABLED);null==b&&(b="false");return !0===a.Util.str2bool(b)},init:function(b){this._context=b;
  this._enabled()?this._context.setVideoState(a.VIDEO_STATE_PLAYING):a.log("VideoStateExtension is disabled.");},dispose:function(){this._context=null;}};a.VideoStateExtension.prototype.constructor=a.VideoStateExtension;a.AdResponse=function(a){this._context=a;};a.AdResponse.prototype={};a.AdResponse.prototype.constructor=a.AdResponse;a.Util.mixin(a.AdResponse.prototype,{parse:function(b,c){this._data=b;this._temporalSlots=[];this._videoPlayerNonTemporalSlots=[];this._siteSectionNonTemporalSlots=[];this._profileParameters=
  {};this._ads=[];this._siteSectionCustomId=a.Util.getObject("siteSection.customId",b)||"";this._adRenderers=[];var d;var e=a.Util.getObject("parameters",b)||[];for(d=0;d<e.length;++d){var f=e[d];this._profileParameters[f.name]=f.value;}this._adRenderers=a.Util.getObject("rendererManifest.adRenderers.adRenderer",b)||[];for(d=0;d<this._adRenderers.length;d++)"undefined"!==typeof this._adRenderers[d].adUnit&&(this._adRenderers[d].baseUnit=this._adRenderers[d].adUnit,delete this._adRenderers[d].adUnit);
  e=a.Util.getObject("ads.ads",b)||[];for(d=0;d<e.length;++d)f=new a.Ad(this._context),f.parse(e[d]),this._ads.push(f);e=a.Util.getObject("siteSection.videoPlayer.videoAsset.adSlots",b)||[];for(d=0;d<e.length;++d)f=new a.Slot(this._context),f.setType(a.SLOT_TYPE_TEMPORAL),f.setBase(c),f.parse(e[d]),this._temporalSlots.push(f);e=a.Util.getObject("siteSection.videoPlayer.adSlots",b)||[];for(d=0;d<e.length;++d)f=new a.Slot(this._context),f.setType(a.SLOT_TYPE_VIDEOPLAYER_NONTEMPORAL),f.setTimePositionClass(a.TIME_POSITION_CLASS_DISPLAY),
  f.parse(e[d]),this._initSlotData(f),this._videoPlayerNonTemporalSlots.push(f);e=a.Util.getObject("siteSection.adSlots",b)||[];for(d=0;d<e.length;++d)f=new a.Slot(this._context),f.setType(a.SLOT_TYPE_SITESECTION_NONTEMPORAL),f.setTimePositionClass(a.TIME_POSITION_CLASS_DISPLAY),f.parse(e[d]),this._initSlotData(f),this._siteSectionNonTemporalSlots.push(f);b=a.Util.getObject("siteSection.videoPlayer.videoAsset",b)||{};this._context._videoAsset.parse(b);},getCreative:function(a,c){return (a=this.getAd(a))?
  a.getCreative(c):null},getAd:function(a){for(var b=0;b<this._ads.length;b++){var d=this._ads[b];if(d.getId()===a)return d}return null},getTemporalSlots:function(){return this._temporalSlots},getSiteSectionNonTemporalSlots:function(){return this._siteSectionNonTemporalSlots},getVideoPlayerNonTemporalSlots:function(){return this._videoPlayerNonTemporalSlots},getSiteSectionCustomId:function(){return this._siteSectionCustomId},getSlotByCustomId:function(b){for(var c=0;c<this._temporalSlots.length;++c)if(this._temporalSlots[c].getCustomId()===
  b)return this._temporalSlots[c];for(c=0;c<this._videoPlayerNonTemporalSlots.length;++c)if(this._videoPlayerNonTemporalSlots[c].getCustomId()===b)return this._videoPlayerNonTemporalSlots[c];for(c=0;c<this._siteSectionNonTemporalSlots.length;++c)if(this._siteSectionNonTemporalSlots[c].getCustomId()===b)return this._siteSectionNonTemporalSlots[c];a.warn("getSlotByCustomId(): not found",b);return null},_initSlotData:function(b){for(var c=!1,d=0;d<this._context._adRequest._slotScanner._knownSlots.length;d++){var e=
  this._context._adRequest._slotScanner._knownSlots[d];if(b.getCustomId()===e.id&&e.element){b.setWidth(e.width);b.setHeight(e.height);b.setBase(e.element);b.setAcceptCompanion(e.acceptCompanion);b.setInitialAdOption(e.initialAdOption);c=!0;break}}c||a.warn("Failed to init slot "+b.getCustomId());return c}});a.Slot=function(b){var c="",d=null,e=null,f=null,h=null,g=[],m=[],l={},n=null,q=a.MediaInitState.instance,r=0,u=null,I,k,z,J,O,P,w=0,L=0,t=[],C=null,E=!1,x=!1,v=!0,F=[],H,Q,D=!1;return {setAutoPlayBlocked:function(a){D=
  a;},getSlotProfile:function(){return e},setSlotProfile:function(a){e=a;},setMediaState:function(a){q=a;},setParameter:function(a,b){null==b?delete l[a]:l[a]=b;},getParameter:function(a){if(a&&l.hasOwnProperty(a))return l[a]},getAdCount:function(){return g.length},setCustomId:function(a){c=a;},getCustomId:function(){return c},setAdUnit:function(a){O=a;},getAdUnit:function(){return O},setType:function(a){d=a;},getType:function(){return d},setTimePosition:function(a){k=a;},getTimePosition:function(){return k},
  setTimePositionClass:function(a){u=a&&a.toUpperCase();},getTimePositionClass:function(){return u},setWidth:function(a){z=a;},getWidth:function(){return u!==a.TIME_POSITION_CLASS_DISPLAY?z?z:b.getVideoDisplaySize().width:z},setHeight:function(a){J=1*a;},getHeight:function(){return u!==a.TIME_POSITION_CLASS_DISPLAY?J?J:b.getVideoDisplaySize().height:J},setBase:function(a){I=a;},getBase:function(){return I},setCuepointSequence:function(a){P=1*a?1*a:0;},getCuepointSequence:function(){return P},getVideoDisplaySize:function(){return b.getVideoDisplaySize()},
  setMaxDuration:function(a){w=1*a?1*a:0;},getMaxDuration:function(){return w},setMinDuration:function(a){L=1*a?1*a:0;},getMinDuration:function(){return L},setAcceptContentType:function(a){if(a&&a.trim()){a=a.split(",");for(var b=0;b<a.length;b++)t.push(a[b].trim());}},setSignalId:function(a){a&&a.trim()&&(C=a);},getSignalId:function(){return C},getAcceptContentType:function(){return t.join(",")},parse:function(d){if(d){c=d.customId;k=1*d.timePosition;u=d.timePositionClass&&d.timePositionClass.toUpperCase()||
  u;O=d.adUnit;C=d.signalId;if(void 0===C||null===C)C=d.outSignalId;for(var e,f=0,h=d.eventCallbacks||[];f<h.length;f++){e=h[f];var l=a.EventCallback.newEventCallback(b,e.name,e.type);l&&(l._slot=this,l.parse(e),m.push(l));}f=0;for(h=d.selectedAds||[];f<h.length;f++)e=h[f],d=[],l=new a.AdInstance(b),d.push(l),l._slot=this,l._slotCustomId=c,l._parentAdInstancesGroup=d,l.parse(e),g.push(d);}},getCurrentAdInstance:function(){return f},isPauseSlot:function(){return u===a.TIME_POSITION_CLASS_PAUSE_MIDROLL},
  play:function(c){if(D)a.log("Resuming previously blocked video ad now."),D=!1,b.getContentVideoElement()&&b.getContentVideoElement().play();else {for(var d=this.getAdInstances(),e=0;e<d.length;e++)d[e]._isSkipped=!1;u!==a.TIME_POSITION_CLASS_DISPLAY||v?(a.log("Slot.play",u),E=!1,u===a.TIME_POSITION_CLASS_DISPLAY&&1<g.length&&g.splice(0,g.length-1),this._play(c)):(a.log("Slot is invisible. Push the play operation to the queue."),F.push({operation:this.play,argument:c}));}},stop:function(){a.log("Slot.stop",
  u);u===a.TIME_POSITION_CLASS_DISPLAY&&(F=[]);q===a.MediaInitState.instance||q===a.MediaEndState.instance?a.log("Slot.stop, not start or already end, ignore"):(E=!0,f?f.stop():a.warn("Slot.stop, no _currentAdInstance, ignore"));},pause:function(){a.log("Slot.pause");u!==a.TIME_POSITION_CLASS_DISPLAY?f&&f.pause():a.log("Not a temporal slot. Ignore.");},resume:function(){a.log("Slot.resume");u!==a.TIME_POSITION_CLASS_DISPLAY?f&&f.resume():a.log("Not a temporal slot. Ignore.");},skipCurrentAd:function(){a.log("Slot.skipCurrentAd ",
  f);f?f.skip():a.log("Slot.skipCurrentAd, no _currentAdInstance, ignore");},setVisible:function(b){if(u!==a.TIME_POSITION_CLASS_DISPLAY)a.log("Slot.setVisible is only for display ads.");else if(a.log("Slot.setVisible",b),v!==b&&(v=b))for(;0<F.length;)b=F.pop(),b.operation&&b.operation.call(this,b.argument);},_play:function(a){n=n||a;q.play(this);},onStartPlaying:function(){this._onStartPlaying();},onStartReplaying:function(){this._onStartPlaying();},onCompletePlaying:function(){this._onCompletePlaying();},
  onCompleteReplaying:function(){this._onCompletePlaying();},playNextAdInstance:function(){a.log("Slot.playNextAdInstance ",u);this._playNextAdInstance()||q.complete(this);},scheduleAdInstance:function(){return h=f.cloneForTranslation()},_clearScheduledAdInstance:function(){h=null;},_onStartPlaying:function(){u===a.TIME_POSITION_CLASS_MIDROLL&&0<g.length&&b._requestContentVideoToPauseBySlot(this);var c=a.EventCallback.getEventCallback(m,a.EVENT_SLOT_IMPRESSION,a.EVENT_TYPE_IMPRESSION);c&&c.process();this.dispatchSlotEvent(a.EVENT_SLOT_STARTED);
  this.playNextAdInstance();},dispatchSlotEvent:function(a){x||b.dispatchEvent(a,{slot:this});},_onCompletePlaying:function(){n&&n();n=null;F=[];var c=a.EventCallback.getEventCallback(m,a.EVENT_SLOT_END,a.EVENT_TYPE_IMPRESSION);c&&c.process();f=null;this.dispatchSlotEvent(a.EVENT_SLOT_ENDED);u===a.TIME_POSITION_CLASS_MIDROLL&&0<g.length&&b._requestContentVideoToResumeBySlot(this);},_playNextAdInstance:function(){if(E||q!==a.MediaPlayingState.instance&&q!==a.MediaReplayingState.instance)return !1;this._commitScheduledAdInstance();
  f=this._nextPlayableAdInstance();if(!f)return !1;f.reset();f._isInitiatedSent||(f.getRendererController().processEvent({name:a.EVENT_AD_INITIATED}),f._isInitiatedSent=!0);f.getRendererController().play();return !0},_commitScheduledAdInstance:function(){if(h){var a=f._parentAdInstancesGroup.indexOf(f);0<=a&&(h._parentAdInstancesGroup=f._parentAdInstancesGroup,f._parentAdInstancesGroup.splice(a,1,h),h=null);}},_nextPlayableAdInstance:function(){if(f){var b=f._parentAdInstancesGroup,c=b.indexOf(f);var d=
  g.indexOf(b);0<=d&&0<=c&&(f._isImpressionSent||f._isSkipped||c===b.length-1)&&d++;}else d=0;if(0>d||d>=g.length)return null;var e;if(q===a.MediaPlayingState.instance)for(b=g[d],e=0;e<b.length;e++){if(c=b[e],c.getRendererController().playable())return c}else if(q===a.MediaReplayingState.instance)for(;d<g.length;d++){b=g[d];for(e=0;e<b.length;e++)if(c=b[e],c._isImpressionSent)return c;for(e=0;e<b.length;e++)if(c=b[e],c.getRendererController().getRendererState()!==a.RendererFailedState.instance&&!c._translated)return c}return null},
  toString:function(){return "[Slot "+c+"]"},getAdInstances:function(){for(var a=[],b=0;b<g.length;++b)for(var c=g[b],d=0;d<c.length;++d){var e=c[d];if(e.isPlayable()){a.push(e);break}}return a},getPlayheadTime:function(){for(var a=0,b=this.getAdInstances(),c=0;c<b.length;++c)if(b[c]===f){b=f.getPlayheadTime();-1<b&&(a+=b);break}else {var d=b[c].getDuration();-1<d&&(a+=d);}r&&a>r&&(a=r);return a},getTotalDuration:function(){if(d!==a.SLOT_TYPE_TEMPORAL)return -1;for(var b=0,c=this.getAdInstances(),e=0;e<
  c.length;++e){var f=c[e].getDuration();-1<f&&(b+=f);}return r=b},playCompanionAds:function(b){a.log("Slot.playCompanionAds");var c=[];b._parentAdInstancesGroup=c;c.push(b);g.push(c);x=!0;f&&this.stop();this.play();},getState:function(){return q},setAcceptCompanion:function(a){H=a;},getAcceptCompanion:function(){return H},setInitialAdOption:function(a){Q=a;},getInitialAdOption:function(){return Q}}};a.SurveyExtension=function(){this._surveyPingedIds=[];};a.SurveyExtension.prototype={init:function(b){this._context=
  b;a.log("SurveyExtension.init("+Array.prototype.slice.call(arguments).join(",")+")");this._onAdStarted=a.Util.bind(this,function(b){this._parameters=this._getParameters();if(this._parameters.enabled){a.log("SurveyExtension.onAdStarted()");var c=b.adInstance;if(-1<this._surveyPingedIds.indexOf(c.getAdId()))a.log("won't pingback survey since it has been pinged back");else {var e=c._creative.getParameter("_fw_survey_url");if(e)try{a.log("append"+e+" to head");var f=document.getElementsByTagName("head")[0],
  h=document.createElement("script");h.setAttribute("type","text/javascript");h.setAttribute("src",e);f.appendChild(h);this._surveyPingedIds.push(c.getAdId());}catch(g){a.warn("Append survey to head",b.type,g);}}}});this._context.addEventListener(a.EVENT_AD_IMPRESSION,this._onAdStarted);},dispose:function(){a.log("SurveyExtension.dispose()");this._context.removeEventListener(a.EVENT_AD_IMPRESSION,this._onAdStarted);this._parameters=this._onAdStarted=null;},_getParameters:function(){var b={};b.enabled="false"!==
  this._context.getParameter(a.PARAMETER_EXTENSION_SURVEY_ENABLED);a.log(b);return b}};a.SurveyExtension.prototype.constructor=a.SurveyExtension;a.ExtensionManager=function(b){this._extensions={};this._context=b;this._surveyExtension=new a.SurveyExtension;this._surveyExtension.init(b);this._videoStateExtension=new a.VideoStateExtension;this._videoStateExtension.init(b);this._displayRefreshExtension=new a.DisplayRefreshExtension;this._displayRefreshExtension.init(b);this._contentVideoExtension=new a.ContentVideoExtension;
  this._contentVideoExtension.init(b);};a.ExtensionManager.prototype={_scriptLoaded:function(b){if(null==this._extensions[b])this._loadFail(b,"Extension supposed to be loaded but not found");else {var c=a.Util.getObject(b);"function"!==typeof c?this._loadFail(b,"Script loaded but extension class not found"):(c=new c,"function"===typeof c.init&&"function"===typeof c.dispose?(a.log("Extension loaded: "+b),c.init(this._context),this._context.dispatchEvent(a.EVENT_EXTENSION_LOADED,{success:!0,moduleName:b})):
  this._loadFail(b,"Extension loaded but is not supported"));}},_getExtensionNameFromUrl:function(a){for(var b=/(?!.*\.{2})(?:[\\/\?=#])([a-z][\w\.]+)(?:\.js(#|\?|$))/gi,d,e;null!=(d=b.exec(a));)e=d;return e?e[1]:null},_loadFail:function(b,c){a.log("Extension failed to load. "+b+" : "+c);this._context.dispatchEvent(a.EVENT_EXTENSION_LOADED,{success:!1,errorVal:c,moduleName:b});},load:function(b){if(b){var c=this._getExtensionNameFromUrl(b);if(null==c)this._loadFail(c,"Extension name not exists in the Url. Url: "+
  b);else if(this._extensions[c]===b)a.log("Extension is already loaded"),this._loadFail(c,"Extension is already loaded");else {var d=1*this._context.getParameter("moduleLoadTimeout")||6E4,e=!1,f=this,h=window.setTimeout(function(){e=!0;f._loadFail(c,"Timeout occured while loading extension. Url: "+b);},d);a.Util.lazyJavaScriptLoad(b,function(){a.log("async load extension successful, URL:"+b);window.clearTimeout(h);e?a.debug("Extension loaded after timeout, do nothing."):(f._extensions[c]=b,f._scriptLoaded(c));});}}else this._loadFail(c,
  "Url cannot be empty");},dispose:function(){this._extensions=null;this._surveyExtension.dispose();this._surveyExtension=null;this._displayRefreshExtension.dispose();this._displayRefreshExtension=null;this._videoStateExtension.dispose();this._videoStateExtension=null;this._contentVideoExtension.dispose();this._context=this._contentVideoExtension=null;}};a.ExtensionManager.prototype.constructor=a.ExtensionManager;a.EventCallback=function(a){this._url=this._name=this._type=null;this._showBrowser=!1;this._trackingUrls=
  [];this._adInstance=this._slot=null;this._context=a;};a.EventCallback.prototype={};a.EventCallback.prototype.constructor=a.EventCallback;a.EventCallback.getEventCallback=function(b,c,d){for(var e,f=0;f<b.length;f++)if(e=b[f],e._name===c&&e._type===d)return e;for(f=0;f<b.length;f++)if(e=b[f],e._type===a.EVENT_TYPE_GENERIC){if(c=a.EventCallback.newEventCallback(e._context,c,d))c._url=e._url,c._slot=e._slot,c._adInstance=e._adInstance,b.push(c);return c}return null};a.EventCallback.newEventCallback=function(b,
  c,d){if(d===a.EVENT_TYPE_GENERIC)b=new a.EventCallback(b);else if(d===a.EVENT_TYPE_ERROR)b=new a.ErrorEventCallback(b);else if(d===a.EVENT_TYPE_CLICK)b=new a.AdClickEventCallback(b);else if(d===a.EVENT_TYPE_STANDARD)b=new a.AdStandardEventCallback(b);else if(c===a.EVENT_SLOT_IMPRESSION||c===a.EVENT_SLOT_END)b=new a.SlotImpressionEventCallback(b);else if(c===a.EVENT_AD_IMPRESSION||c===a.EVENT_AD_IMPRESSION_END)b=new a.AdImpressionEventCallback(b);else if(c===a.EVENT_VIDEO_VIEW)b=new a.VideoViewEventCallback(b);
  else if(c===a.EVENT_RESELLER_NO_AD)b=new a.ResellerNoAdEventCallback(b);else if(c===a.EVENT_AD_FIRST_QUARTILE||c===a.EVENT_AD_MIDPOINT||c===a.EVENT_AD_THIRD_QUARTILE||c===a.EVENT_AD_COMPLETE)b=new a.AdQuartileEventCallback(b);else return null;b._name=c;b._type=d;return b};a.EventCallback.getShortType=function(b){var c="";switch(b){case a.EVENT_TYPE_IMPRESSION:c=a.SHORT_EVENT_TYPE_IMPRESSION;break;case a.EVENT_TYPE_CLICK:c=a.SHORT_EVENT_TYPE_CLICK;break;case a.EVENT_TYPE_STANDARD:c=a.SHORT_EVENT_TYPE_STANDARD;
  break;case a.EVENT_TYPE_ERROR:c=a.SHORT_EVENT_TYPE_ERROR;}return c};a.Util.mixin(a.EventCallback.prototype,{parse:function(a){if(a){this._usage=a.use;this._type=a.type;this._name=a.name;this._url=a.url;this._showBrowser=a.showBrowser;this._trackingUrls=[];var b=0;for(a=a.trackingUrls||[];b<a.length;b++)this._trackingUrls.push(a[b].value);}},copy:function(){var a=new this.constructor(this._context);a._type=this._type;a._name=this._name;a._url=this._url;a._showBrowser=this._showBrowser;a._trackingUrls=
  this._trackingUrls.slice();a._slot=this._slot;a._adInstance=this._adInstance;return a},getUrl:function(b){var c=this._replaceMacrosInUrl(this._url,b);this._name===a.EVENT_AD_MEASUREMENT?(c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_ET,a.SHORT_EVENT_TYPE_IMPRESSION),c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_CONCRETE_EVENT_ID,b[a.INFO_KEY_CONCRETE_EVENT_ID])):c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_ET,a.EventCallback.getShortType(this._type));c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_CN,
  this._name);this._adInstance&&0<this._adInstance._creativeRenditionId&&(c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_CREATIVE_RENDITION_ID,this._adInstance._creativeRenditionId));return c},getTrackingUrls:function(b){var c=this._trackingUrls;if(this._adInstance){var d=this._type;d===a.EVENT_TYPE_CLICK&&(d=a.EVENT_TYPE_CLICK_TRACKING);c=c.concat(this._adInstance.getExternalEventCallbackUrls(this._name,d));}d=[];for(var e=0;e<c.length;e++){var f=a.Util.trim(this._replaceMacrosInUrl(c[e],b));a.Util.isBlank(f)||
  d.push(f);}return d},process:function(b){b=b||{};this._processTrackingUrls(b);a.Util.pingURL(this.getUrl(b));},_processTrackingUrls:function(b){this._shouldSkipSendingTrackingAndExternalUrls()||a.Util.pingURLs(this.getTrackingUrls(b));},_shouldSkipSendingTrackingAndExternalUrls:function(){return !1},_needEmptyCT:function(b){var c=!1;b&&!0===b[a.INFO_KEY_NEED_EMPTY_CT]&&(c=!0);return c},_getAdPlayheadTime:function(){var a=-1;this._adInstance&&(a=this._adInstance.getPlayheadTime());return a},_getCreativeAssetLocation:function(){var a=
  null;this._adInstance&&this._adInstance.getActiveCreativeRendition()&&this._adInstance.getActiveCreativeRendition().getPrimaryCreativeRenditionAsset()&&(a=this._adInstance.getActiveCreativeRendition().getPrimaryCreativeRenditionAsset().getProxiedUrl());return a},_getParameter:function(a){return this._adInstance?this._adInstance._rendererController.getParameter(a):this._slot?this._slot.getParameter(a):this._context.getParameter(a)},_replaceVASTMacro:function(b,c,d){a.log("replace VAST Macro: url=",
  b+", macro="+c+", value="+d);b&&c&&(d=encodeURIComponent(d?d:""),b=b.replace("["+c+"]",d),b=b.replace("%5B"+c+"%5D",d));return b},_replaceMacrosInUrl:function(b,c){if(a.Util.isBlank(b))return b;c&&c[a.INFO_KEY_VAST_ERROR_CODE]&&(b=this._replaceVASTMacro(b,"ERRORCODE",c[a.INFO_KEY_VAST_ERROR_CODE]));this._getCreativeAssetLocation()&&(b=this._replaceVASTMacro(b,"ASSETURI",this._getCreativeAssetLocation()));var d=this._context._getContentPlayheadTime();this._adInstance&&(c=null!=d&&0<=Number(d)?a.Util.secondsToHms(d):
  "",b=this._replaceVASTMacro(b,"CONTENTPLAYHEAD",c),b=this._replaceVASTMacro(b,"CACHEBUSTING",a.Util.getFixedDigitRandomNumber(8)),b=this._replaceVASTMacro(b,"TIMESTAMP",a.Util.getDateStringInISOFormat(new Date)));b=b.replace(/#(ce?)\{([^\}]+)\}/g,a.Util.bind(this,function(b,c,h){a.log("matchedSubString"+b);b="ce"===c;c=null;switch(h){case "ad.playheadTime":h=this._getAdPlayheadTime();c=0<=h?Math.round(h)+"":"";break;case "content.playheadTime":c=0<=d?Math.round(d)+"":"";break;case "creative.assetLocation":c=
  this._getCreativeAssetLocation();break;default:0===h.indexOf("parameter.")&&(c=this._getParameter(h.substr(10)));}a.Util.isBlank(c)&&(c="");return b?encodeURIComponent(c):c}));c="";try{c=a.Util.getParameterInURL(b,a.URL_PARAMETER_KEY_CR);}catch(e){return a.warn(e),b}a.Util.isBlank(c)||(b=a.Util.setParameterInURL(b,a.URL_PARAMETER_KEY_CR,this._replaceMacrosInUrl(c)));return b}});a.AdClickEventCallback=function(b){a.EventCallback.call(this,b);};a.AdClickEventCallback.prototype=new a.EventCallback;a.AdClickEventCallback.prototype.constructor=
  a.AdClickEventCallback;a.Util.mixin(a.AdClickEventCallback.prototype,{getUrl:function(b){var c=a.EventCallback.prototype.getUrl.call(this,b);b[a.INFO_KEY_URL]&&(a.Util.isParameterInURL(c,a.URL_PARAMETER_KEY_CR)||(c=c+"&"+a.URL_PARAMETER_KEY_CR+"="),c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_CR,b[a.INFO_KEY_URL]));return c},process:function(b){b=b||{};var c=this.getUrl(b),d=!0===this._showBrowser;d=b.hasOwnProperty(a.INFO_KEY_SHOW_BROWSER)?!0===b[a.INFO_KEY_SHOW_BROWSER]:d;b[a.INFO_KEY_URL]&&
  (d=!0);d&&!a.Util.isBlank(c)?(window.open(c),this._processTrackingUrls(b)):a.EventCallback.prototype.process.call(this,b);}});a.AdImpressionEventCallback=function(b){a.EventCallback.call(this,b);};a.AdImpressionEventCallback.prototype=new a.EventCallback;a.AdImpressionEventCallback.prototype.constructor=a.AdImpressionEventCallback;a.Util.mixin(a.AdImpressionEventCallback.prototype,{_shouldSkipSendingTrackingAndExternalUrls:function(){return this._getInitValue()!==a.INIT_VALUE_ONE},_getInitValue:function(){return this._adInstance.getSlot().isPauseSlot()||
  !this._processed?a.INIT_VALUE_ONE:a.INIT_VALUE_TWO},getUrl:function(b){var c=a.EventCallback.prototype.getUrl.call(this,b);c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_METR,this._adInstance._metr);this._name!==a.EVENT_AD_IMPRESSION&&(c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_CT,this._needEmptyCT(b)?"":this._adInstance._timer.tick()));return c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_INIT,this._getInitValue())},process:function(b){a.MODULE_TYPE_TRANSLATOR!==this._adInstance.getRendererController().getRenderer().info()[a.INFO_KEY_MODULE_TYPE]&&
  (a.EventCallback.prototype.process.call(this,b),this._processed=!0);}});a.AdQuartileEventCallback=function(b){a.EventCallback.call(this,b);};a.AdQuartileEventCallback.prototype=new a.EventCallback;a.AdQuartileEventCallback.prototype.constructor=a.AdQuartileEventCallback;a.Util.mixin(a.AdQuartileEventCallback.prototype,{getUrl:function(b){var c=a.EventCallback.prototype.getUrl.call(this,b);c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_METR,this._adInstance._metr);return c=a.Util.setParameterInURL(c,
  a.URL_PARAMETER_KEY_CT,this._needEmptyCT(b)?"":this._adInstance._timer.tick())},process:function(b){this._processed||(a.EventCallback.prototype.process.call(this,b),this._processed=!0);}});a.AdStandardEventCallback=function(b){a.EventCallback.call(this,b);};a.AdStandardEventCallback.prototype=new a.EventCallback;a.AdStandardEventCallback.prototype.constructor=a.AdStandardEventCallback;a.ErrorEventCallback=function(b){a.EventCallback.call(this,b);};a.ErrorEventCallback.prototype=new a.EventCallback;a.ErrorEventCallback.prototype.constructor=
  a.ErrorEventCallback;a.Util.mixin(a.ErrorEventCallback.prototype,{getUrl:function(b){var c=a.EventCallback.prototype.getUrl.call(this,b),d=b[a.INFO_KEY_ERROR_CODE];d||(d=a.ERROR_UNKNOWN);var e=b[a.INFO_KEY_ERROR_INFO];e||(e="");(b=b[a.INFO_KEY_ERROR_MODULE])||(b="");c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_CN,d);return c=a.Util.setParameterInURL(c,a.URL_PARAMETER_KEY_KEY_VALUE,encodeURIComponent(a.URL_PARAMETER_KEY_ERROR_MODULE)+"="+encodeURIComponent(b)+"&"+encodeURIComponent(a.URL_PARAMETER_KEY_ERROR_INFO)+
  "="+a.PLATFORM_ID+"/"+encodeURIComponent(e))}});a.ResellerNoAdEventCallback=function(b){a.EventCallback.call(this,b);};a.ResellerNoAdEventCallback.prototype=new a.EventCallback;a.ResellerNoAdEventCallback.prototype.constructor=a.ResellerNoAdEventCallback;a.Util.mixin(a.ResellerNoAdEventCallback.prototype,{});a.SlotImpressionEventCallback=function(b){a.EventCallback.call(this,b);};a.SlotImpressionEventCallback.prototype=new a.EventCallback;a.SlotImpressionEventCallback.prototype.constructor=a.SlotImpressionEventCallback;
  a.Util.mixin(a.SlotImpressionEventCallback.prototype,{_shouldSkipSendingTrackingAndExternalUrls:function(){return this._getInitValue()!==a.INIT_VALUE_ONE},_getInitValue:function(){return this._slot.isPauseSlot()||!this._processed?a.INIT_VALUE_ONE:a.INIT_VALUE_TWO},getUrl:function(b){b=a.EventCallback.prototype.getUrl.call(this,b);return b=a.Util.setParameterInURL(b,a.URL_PARAMETER_KEY_INIT,this._getInitValue())},process:function(b){a.EventCallback.prototype.process.call(this,b);this._processed=!0;}});
  a.VideoViewEventCallback=function(b){a.EventCallback.call(this,b);};a.VideoViewEventCallback.prototype=new a.EventCallback;a.VideoViewEventCallback.prototype.constructor=a.VideoViewEventCallback;a.Util.mixin(a.VideoViewEventCallback.prototype,{_getInitValue:function(){return this._processed?a.INIT_VALUE_ZERO:a.INIT_VALUE_ONE},_getCTValue:function(){return this._context._videoAsset.getPlayheadTime()},getUrl:function(b){b=a.EventCallback.prototype.getUrl.call(this,b);b=a.Util.setParameterInURL(b,a.URL_PARAMETER_KEY_INIT,
  this._getInitValue());return b=a.Util.setParameterInURL(b,a.URL_PARAMETER_KEY_CT,this._getCTValue())},_shouldSkipSendingTrackingAndExternalUrls:function(){return this._processed},process:function(b){a.EventCallback.prototype.process.call(this,b);this._processed=!0;}});a.VideoRenderer=function(){this._adVideo=null;this._duration=this._playheadTime=-1;this._dragging=this._stopInvoked=this._isEnded=!1;this._volume=1;this._rendererController=null;this._isBuffering=!1;this._autoPauseAdOnVisibilityChange=
  !0;this._videoPausedByRenderer=!1;this._hls=null;};a.VideoRenderer.prototype={pause:function(){this._rendererController&&this._rendererController.processEvent({name:a.EVENT_AD_PAUSE});this._adVideo&&!this._adVideo.paused&&(this._adVideo.pause(),this._videoPausedByRenderer=!0);},resume:function(){this._rendererController&&this._rendererController.processEvent({name:a.EVENT_AD_RESUME});this._adVideo&&this._adVideo.paused&&this._adVideo.play();},start:function(b){this._rendererController=b;b=this._rendererController.getAdInstance();
  var c=b.getSlot(),d=this,e=!1,f=!1,h=!1;this._autoPauseAdOnVisibilityChange=this._rendererController.getParameter(a.PARAMETER_AUTO_PAUSE_AD_ONVISIBILITYCHANGE);if(a.PLATFORM_NOT_SUPPORT_VIDEO_AD)this._onRendererFailed(a.ERROR_DEVICE_LIMIT,c.getTimePositionClass());else if(a.PLATFORM_NOT_SUPPORT_MIDROLL_AD&&c.getTimePositionClass()===a.TIME_POSITION_CLASS_MIDROLL)this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"midroll");else {a.log("VideoRenderer.start",c.getTimePositionClass(),b);var g=this._rendererController.getContentVideoElement();
  a.debug("VideoRenderer","use content video element");g.controls=!1;this._adVideo=g;var m=null,l=null,n=null,q=null,r=c.getVideoDisplaySize().width,u=c.getVideoDisplaySize().height,I=b.getRenderableCreativeRenditions(),k=(r=(new a.RenditionSelector(this._rendererController.getParameter(a.PARAMETER_DESIRED_BITRATE)||1E3,this._rendererController.getParameter("arWeight")||1,this._rendererController.getParameter("pxWeight")||1,.2)).getBestFitRendition(I,r,u))?r.getPrimaryCreativeRenditionAsset():null;
  if(k&&I.length)if(I=k.getProxiedUrl()){b.setActiveCreativeRendition(r);a.log("VideoRenderer.start selected rendition is:",I);var z="application/x-mpegurl"===r.getContentType()||"application/vnd.apple.mpegurl"===r.getContentType();this._rendererController.setCapability(a.EVENT_AD_QUARTILE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_MUTE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_PAUSE,a.CAPABILITY_STATUS_ON);var J=!a.PLATFORM_NOT_SUPPORT_CLICK_FOR_VIDEO;
  J||this._rendererController.setCapability(a.EVENT_AD_CLICK,a.CAPABILITY_STATUS_OFF);var O=a.PLATFORM_EVENT_CLICK,P=a.MOBILE_EVENT_DRAG;this._volume=this._rendererController.getContext().getAdVolume();this._adVideo.volume=this._volume;this._adVideo.muted=0===this._volume;var w=function(b){a.debug("VideoRenderer.checkTimeUpdate timeout");A(b);},L=function(){l&&(clearTimeout(l),l=null);},t=a.Util.bind(this,function(b){a.debug("onAdVideoBufferEmpty(): Ad video event "+b.type);b=this._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_PLAY_AFTER_STALLED);
  null!==b&&"undefined"!==typeof b&&!1!==a.Util.str2bool(b)&&(a.debug("play the ad immediately after the stalled event"),g&&g._fw_videoAdPlaying&&g.play());}),C=function(b){d._isBuffering||(d._isBuffering=!0,d._rendererController.processEvent({name:a.EVENT_AD_BUFFERING_START}),a.debug("onAdVideoBufferingStarted(): Ad video event "+b.type));},E=function(b){d._isBuffering&&(d._isBuffering=!1,d._rendererController.processEvent({name:a.EVENT_AD_BUFFERING_END}),a.debug("onAdVideoBufferingEnded(): Ad video event "+
  b.type));};b=this._rendererController.getParameter(a.PARAMETER_EXTENSION_AD_CONTROL_CLICK_ELEMENT);var x=null;b&&(x=document.getElementById(b));x||(x=g);var v=a.Util.bind(this,function(b){if(g.paused&&a.PLATFORM_NOT_FIRE_CLICK_WHEN_AD_VIDEO_PAUSED)g.play();else {var c=this._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_CLICK_DETECTION);null==c&&(c="true");!1!==a.Util.str2bool(c)&&(f?(a.debug("Ad video event "+b.type),this._dragging?this._dragging=!1:this._rendererController.processEvent({name:a.EVENT_AD_CLICK})):
  a.debug("Ad not started, ignore click."));}}),F=a.Util.bind(this,function(b){a.debug("Ad video event "+b.type);this._dragging=!0;}),H,Q=function(b){a.debug("Ad video event "+b.type+" ended: "+g.ended+" playing:"+g._fw_videoAdPlaying);if(g.ended&&.2>Math.abs(g.duration-g.currentTime)||!g._fw_videoAdPlaying)H=setTimeout(function(){a.warn("Force ad video end bc ad paused with ended = true");b.type="ended";M(b);},200);else {var c=d._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_DISPLAY_CONTROLS_WHEN_PAUSE);
  null==c&&(c="true");!1===a.Util.str2bool(c)?a.debug("Pause controls disabled"):g.controls=!0;L();}},D=function(b){a.debug("Ad video event "+b.type);this._videoPausedByRenderer=g.controls=!1;},G=0,R=function(b){a.debug("Ad video event "+b.type);0>=g.currentTime?a.debug("VideoRenderer.onAdVideoTimeUpdate currentTime is less than or 0"):(L(),g.paused||(b=d._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_PROGRESS_DETECT_TIMEOUT)||8E3,l=setTimeout(w,b,b+"ms timeout when playing")),f||(f=!0,d._playheadTime=
  g.currentTime,0>d._playheadTime&&(d._playheadTime=0),m&&(clearTimeout(m),m=null),d._quartileTimerId=setInterval(function(){var b=g.currentTime,c=g.duration;0<b&&(d._playheadTime=b);0<c&&(d._duration=c);"number"!==typeof b||"number"!==typeof c||n||(b>=.25*c&&1>G&&(d._rendererController.processEvent({name:a.EVENT_AD_FIRST_QUARTILE}),G=1),b>=.5*c&&2>G&&(d._rendererController.processEvent({name:a.EVENT_AD_MIDPOINT}),G=2),b>=.75*c&&3>G&&(clearInterval(d._quartileTimerId),d._quartileTimerId=null,d._rendererController.processEvent({name:a.EVENT_AD_THIRD_QUARTILE}),
  G=3));},1E3),d._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED)));};this.dispose=a.Util.bind(this,function(){M();});var M=function(b){var c=n;b&&b.type&&(a.debug("Ad video event "+b.type),"error"===b.type&&(a.warn(b.target.src),a.warn(b.target.currentSrc),E(b)));L();m&&(clearTimeout(m),m=null);J&&(x.removeEventListener(O,v,!1),x.removeEventListener(P,F,!1));H&&(clearTimeout(H),H=null);K&&d._autoPauseAdOnVisibilityChange&&(document.removeEventListener("visibilitychange",K,!1),K=null);
  g.removeEventListener("ended",M,!1);g.removeEventListener("error",M,!0);g.removeEventListener("pause",Q,!1);g.removeEventListener("playing",D,!1);g.removeEventListener("timeupdate",R,!1);g.removeEventListener("stalled",t,!1);g.removeEventListener("waiting",C,!1);g.removeEventListener("canplay",E,!1);g.paused||(a.debug("try pausing video before complete"),g.pause());b&&"error"===b.type&&(c="video error",(b=g.error||b.target.error)&&(c="error:"+b+",code:"+b.code));c||(d._isEnded=!0);a.log("VideoRenderer.complete");
  e||(e=!0,delete g._fw_videoAdPlaying,d._adVideo=null,d._quartileTimerId&&(clearInterval(d._quartileTimerId),d._quartileTimerId=null),c?d._onRendererFailed(q,c):(d._stopInvoked||(g.currentTime>=.25*g.duration&&1>G&&(d._rendererController.processEvent({name:a.EVENT_AD_FIRST_QUARTILE}),G=1),g.currentTime>=.5*g.duration&&2>G&&(d._rendererController.processEvent({name:a.EVENT_AD_MIDPOINT}),G=2),g.currentTime>=.75*g.duration&&3>G&&(d._rendererController.processEvent({name:a.EVENT_AD_THIRD_QUARTILE}),G=
  3),g.currentTime>=g.duration-.5&&4>G&&(d._rendererController.processEvent({name:a.EVENT_AD_COMPLETE}),G=4)),d._stopInvoked=!1,d._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED)));d._rendererController=null;d._hls&&d._hls.destroy();};var A=function(b){n=b;q=a.ERROR_TIMEOUT;a.warn(n);a.PLATFORM_WAIT_WHEN_AD_VIDEO_TIMEOUT||M();},K=function(b){a.log("onVisibilityChange:"+(document.hidden?"invisible":"visible"));document.hidden?g&&!g.paused?(g.pause(),h=!0,d._rendererController&&d._rendererController.processEvent({name:a.EVENT_AD_PAUSE}),
  m&&(clearTimeout(m),m=null)):g&&g.paused&&z&&!d._videoPausedByRenderer&&(h=!0,d._rendererController&&d._rendererController.processEvent({name:a.EVENT_AD_PAUSE}),m&&(clearTimeout(m),m=null)):g&&g.paused&&h&&(g.play(),h=!1,d._rendererController&&d._rendererController.processEvent({name:a.EVENT_AD_RESUME}),f||!g._fw_fromVideoPool&&!a.PLATFORM_SUPPORT_VIDEO_START_DETECT_TIMEOUT||(b=d._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_START_DETECT_TIMEOUT)||5E3,m=setTimeout(A,b,b+"ms timeout before playing")));};
  g._fw_videoAdPlaying=!0;var T=!1,B=function(){if(!T){T=!0;J&&(x.addEventListener(O,v,!1),x.addEventListener(P,F,!1));g.addEventListener("ended",M,!1);g.addEventListener("error",M,!0);g.addEventListener("pause",Q,!1);g.addEventListener("playing",D,!1);g.addEventListener("timeupdate",R,!1);g.addEventListener("stalled",t,!1);g.addEventListener("waiting",C,!1);g.addEventListener("canplay",E,!1);if(z)if("undefined"!==typeof Hls){if(Hls.isSupported()){var b=Hls.version;b=b.replace("-beta","");0<=a.Util.compareVersion(b,
  a.PLATFORM_HLSJS_MIN_VERSION)?(a.log("VideoRenderer loading hls rendition using hls.js version",b),d._hls=new window.Hls,d._hls.on(Hls.Events.ERROR,function(b,c){if(c.fatal)switch(c.type){case Hls.ErrorTypes.NETWORK_ERROR:a.debug("VideoRenderer has encountered fatal hls network error and attempting to recover");d._hls.startLoad();break;case Hls.ErrorTypes.MEDIA_ERROR:a.debug("VideoRenderer has encountered fatal hls media error and attempting to recover");d._hls.recoverMediaError();break;default:d._hls.destroy(),
  a.debug("VideoRenderer has encountered unrecoverable fatal hls error. Details: "+c.details),d._onRendererFailed(a.ERROR_HLSJS,c.details);}else a.debug("VideoRenderer has encountered non-fatal hls network error. Automatic recovery attempt by hls.js.");}),d._hls.attachMedia(g),d._hls.on(Hls.Events.MEDIA_ATTACHED,function(){d._hls.loadSource(k.getProxiedUrl());d._hls.on(Hls.Events.MANIFEST_PARSED,function(b,c){a.debug("VideoRenderer hls manifest successfully parsed, found "+c.levels.length+" quality level");});})):
  0>a.Util.compareVersion(b,a.PLATFORM_HLSJS_MIN_VERSION)?a.warn("Found hls.js version is too old and incompatible. Please upgrade to v0.11.0 or higher. Current version:",b):a.warn("Unable to find successful hls support.");}}else g.src=k.getProxiedUrl(),a.debug("VideoRenderer loading hls rendition on Safari "+g.src),g.load();else g.src=k.getProxiedUrl(),a.debug("VideoRenderer loading video ad "+g.src),g.load();if(g._fw_fromVideoPool||a.PLATFORM_SUPPORT_VIDEO_START_DETECT_TIMEOUT)b=d._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_START_DETECT_TIMEOUT)||
  5E3,m=setTimeout(A,b,b+"ms timeout before playing");a.PLATFORM_VIDEO_DOESNOT_SUPPORT_TIMEUPDATE&&d._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED);b=100;0<a.PLATFORM_ANDROID_VERSION&&(b=d._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_ANDROID_DELAY)||100);setTimeout(function(){var b=g.play();b&&a.PLATFORM_BLOCKS_AUTOPLAY&&b.catch(function(b){if(b&&"AbortError"===b.name||"NotAllowedError"===b.name)a.warn("Blocked by browser, need player to display a start button. Details: %o",
  b),m&&(clearTimeout(m),m=null),c.setAutoPlayBlocked(!0),d._rendererController.processEvent({name:a.EVENT_AD_AUTO_PLAY_BLOCKED,info:{apiOnly:!0}});});document.hidden&&g&&d._autoPauseAdOnVisibilityChange&&(a.log("VideoRenderer pause ad when tab is invisible."),g&&!g.paused&&(g.pause(),h=!0,d._rendererController&&d._rendererController.processEvent({name:a.EVENT_AD_PAUSE})),m&&(clearTimeout(m),m=null));},b);d._autoPauseAdOnVisibilityChange&&document.addEventListener("visibilitychange",K,!1);}};a.VideoRenderer._fw_playedDummyVideo||
  c.getTimePositionClass()!==a.TIME_POSITION_CLASS_PREROLL||!a.PLATFORM_PLAY_DUMMY_VIDEO_FOR_PREROLL||/\.webm$/.test(k.getProxiedUrl())?B():(a.VideoRenderer._fw_playedDummyVideo=!0,a.debug("play dummy video for iOS 3.2-4.1"),g.src="http://127.0.0.1:1/404.mp4",g.load(),g.play(),g._fw_videoAdPlaying=!0,g.addEventListener("error",function(){event.target.removeEventListener("error",g,!0);B();},!0),setTimeout(B,a.PLATFORM_NOT_WAIT_FOR_ERROR_WHEN_PLAY_DUMMY_VIDEO_FOR_PREROLL?500:5E3));}else this._onRendererFailed(a.ERROR_NULL_ASSET);
  else this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"no compatible asset");}},stop:function(){a.debug("VideoRenderer stop");this._stopInvoked=!0;this._adVideo&&(this._adVideo._fw_videoAdPlaying=!1,this._adVideo.pause(),this.dispose());this._rendererController=null;},info:function(){return {moduleType:a.MODULE_TYPE_RENDERER}},getPlayheadTime:function(){if(this._isEnded&&0<this._duration)return this._duration;if(this._adVideo){var a=this._adVideo.currentTime;if(0<a)return a}return this._playheadTime},getDuration:function(){return this._duration},
  setVolume:function(b){a.debug("VideoRenderer setVolume("+b+")");this._adVideo?(this._adVideo.volume=b,this._adVideo.muted=0===b,this._volume!==b&&this._rendererController.processEvent({name:a.EVENT_AD_VOLUME_CHANGE}),0===this._volume&&0!==b?this._rendererController.processEvent({name:a.EVENT_AD_UNMUTE}):0!==this._volume&&0===b&&this._rendererController.processEvent({name:a.EVENT_AD_MUTE}),this._volume=b):a.debug("VideoRenderer ad video is null, ignore.");},_onRendererFailed:function(b,c,d){var e={};
  e[a.INFO_KEY_ERROR_MODULE]="VideoRenderer";e[a.INFO_KEY_ERROR_CODE]=b;d||(d=a.ERROR_VAST_GENERAL_LINEAR_ERROR);e[a.INFO_KEY_VAST_ERROR_CODE]=d;c&&(e[a.INFO_KEY_ERROR_INFO]=c);this._rendererController.handleStateTransition(a.RENDERER_STATE_FAILED,e);}};a.VideoRenderer.prototype.constructor=a.VideoRenderer;a.AdRequest=function(b){this._context=b;this._capabilities=new a.Capabilities;this._keyValues=[];this._playerProfile="";this._compatibleDimensions=null;this._temporalSlots=[];this._siteSectionId=this._siteSectionCustomId=
  "";this._siteSectionNetworkId=0;this._siteSectionFallbackId="";this._siteSectionViewRandom=0;this._requestMode=this._visitorIpV4Address=this._visitorCustomId="";this._subsessionToken=this._requestDuration=0;this._candidateAdIds=[];this._slotScanner=new a.PageSlotScanner(b);this._urlParams={};this._urlKeyValues=[];this._customInfo="";};a.AdRequest.prototype={setCapability:function(a,c){this._capabilities.setCapability(a,c);},addKeyValue:function(b,c){"string"!==typeof b||"string"!==typeof c||0===b.length?
  a.warn("AdRequest.addKeyValue:","key and value required"):(b=encodeURIComponent(b)+"="+encodeURIComponent(c),0>this._keyValues.indexOf(b)&&this._keyValues.push(b));},removeKey:function(b){if("string"!==typeof b||0===b.length)a.warn("AdRequest.removeKey:","key required");else {b=encodeURIComponent(b);for(var c=this._keyValues,d=c.length-1;0<=d;--d)c[d].split("=")[0]===b&&this._keyValues.splice(d,1);}},setProfile:function(b){"string"!==typeof b?a.warn("AdRequest.setProfile:","player profile required"):
  this._playerProfile=b;},setVideoDisplayCompatibleSizes:function(b){if(b&&b.length){for(var c=[],d={},e=0;e<b.length;++e)if(a.debug("dimension is:",b[e].width,"X",b[e].height),0<b[e].width&&0<b[e].height){var f=b[e].width+","+b[e].height;null==d[f]&&(d[f]="",c.push(f));}0<c.length&&(this._compatibleDimensions=c.join("|"));}else a.warn("AdRequest.setVideoDisplayCompatibleSizes:","compatible dimensions required");},setSiteSection:function(b,c,d,e,f){if(b){switch(e){case a.ID_TYPE_FW:this._siteSectionId=
  b;break;case a.ID_TYPE_GROUP:this._siteSectionId="g"+b;break;default:this._siteSectionCustomId=b;}0<1*c&&(this._siteSectionNetworkId=1*c);0<1*d&&(this._siteSectionViewRandom=1*d);"number"===typeof f&&0<f?this._siteSectionFallbackId=""+f:"string"===typeof f&&(this._siteSectionFallbackId=f.trim());}else a.warn("AdRequest.setSiteSection: id required");},setVisitor:function(b,c){"string"!==typeof b?a.warn("AdRequest.setVisitor:","customId required"):(this._visitorCustomId=b,"string"===typeof c&&""!==c&&
  (this._visitorIpV4Address=c));},setRequestMode:function(b){b!==a.REQUEST_MODE_ON_DEMAND&&b!==a.REQUEST_MODE_LIVE?a.warn("AdRequest.setRequestMode:","unknown mode: "+b):(this._requestMode=b,this._requestMode===a.REQUEST_MODE_LIVE&&0===this._subsessionToken&&this.setSubsessionToken(1E4*Math.random()+1));},setRequestDuration:function(b){"number"!==typeof b?a.warn("AdRequest.setRequestDuration:","request duration required"):(0>b&&(a.warn("AdRequest.setRequestDuration:","requestDuration is negative, reset it to 0"),
  b=0),this._requestDuration=b);},addCandidateAd:function(b){"number"!==typeof b?a.warn("AdRequest.addCandidateAd:","candidate ad ID required"):0>b?a.warn("AdRequest.addCandidateAd","invalid ad ID, ignore"):this._candidateAdIds.push(b);},addTemporalSlot:function(b,c,d,e,f,h,g,m,l){if(a.Util.isBlank(b)||a.Util.isBlank(c)||0>d)a.warn("AdRequest.addTemporalSlot:","invalid parameters");else {for(var n=0;n<this._temporalSlots.length;n++)if(this._temporalSlots[n].getCustomId()===b){a.warn("AdRequest.addTemporalSlot:",
  "slot with custom Id: "+b+" is already added, ignoring the duplicate addition");return}n=new a.Slot(this._context);n.setCustomId(b);n.setAdUnit(c);n.setTimePosition(d);n.setSlotProfile(e);n.setCuepointSequence(1*f);n.setMaxDuration(h);n.setMinDuration(g);n.setAcceptContentType(m);n.setSignalId(l);this._temporalSlots.push(n);}},setSubsessionToken:function(a){this._subsessionToken=a;},scanPageSlots:function(){this._slotScanner.scanPageSlots();},generateTypeBRequestUrl:function(){var b=this._context._adManager._serverURL.split("?"),
  c=b[0],d=[/fwmrm\.net$/,/fwmrm\.net\/$/,/fwmrm\.net\/ad$/,/fwmrm\.net\/ad\/$/,/fwmrm\.net\/ad\/g$/,/fwmrm\.net\/ad\/g\/$/,/fwmrm\.net\/ad\/g\/1$/];if(0===c.indexOf("http://")||0===c.indexOf("https://"))for(var e=0;e<d.length;++e)if(c.match(d[e])){c=c.slice(0,c.indexOf("fwmrm.net")+9)+"/ad/g/1";break}this.parseQueryStr(b.slice(1).join("?"));b=this.generateGlobalParametersQueryStr()+";"+this.generateKeyValuesStr()+";";this._capabilities.getCapability(a.CAPABILITY_SKIP_AD_SELECTION)&&1===this._capabilities.getCapability(a.CAPABILITY_SKIP_AD_SELECTION)||
  (b+=this.generateSlotsTypeBStr());a.Util.isBlank(this._customInfo)||(b+=";"+this._customInfo);return c+"?"+b},generateVideoViewRequestUrlWithDummyContextInstanceId:function(b){this._context.setCapability(a.CAPABILITY_REQUIRE_VIDEO_CALLBACK,a.CAPABILITY_STATUS_ON);this._context.setCapability(a.CAPABILITY_SKIP_AD_SELECTION,a.CAPABILITY_STATUS_ON);var c=this.generateTypeBRequestUrl();c=a.Util.setParameterInURL(c,"cbfn","tv.freewheel.SDK._instanceQueue['Context_"+b+"']._videoAsset.requestComplete");a.debug("generateVideoViewRequestUrlWithDummyContextInstanceId():"+
  c);this._context.setCapability(a.CAPABILITY_REQUIRE_VIDEO_CALLBACK,a.CAPABILITY_STATUS_UNSET);this._context.setCapability(a.CAPABILITY_SKIP_AD_SELECTION,a.CAPABILITY_STATUS_UNSET);return c},parseQueryStr:function(b){var c=b;a.debug("AdRequest.parseQueryStr("+Array.prototype.slice.call(arguments).join(",")+")");this._urlParams={};this._urlKeyValues=[];this._customInfo="";if(c){";"===c.charAt(c.length-1)&&(c=c.substring(0,c.length-1));c=c.split(";");var d;if(c[0]){var e=c[0].split("&");for(d=0;d<e.length;++d){var f=
  e[d].split("=");2===f.length&&(this._urlParams[f[0]]=f[1]);}}if(c[1])for(e=c[1].split("&"),d=0;d<e.length;++d)this._urlKeyValues.push(e[d]);c[2]&&(this._customInfo=c.slice(2).join(";"));}},generateGlobalParametersQueryStr:function(){a.debug("AdRequest.generateGlobalParametersQueryStr");var b=this._context.getParameter("wrapperVersion");b=[["prof",this._playerProfile,"string"],["nw",this._context._adManager._networkId,"number"],["caid",this._context._videoAsset._customId,"string"],["asid",this._context._videoAsset._id,
  "string"],["vdur",this._context._videoAsset._duration,"number"],["asnw",this._context._videoAsset._networkId,"number"],["asml",this._context._videoAsset._location,"string"],["vprn",this._context._videoAsset._viewRandom,"number"],["afid",this._context._videoAsset._fallbackId,"string"],["vdty",this._context._videoAsset._durationType,"string"],["vtpo",this._context._videoAsset._currentTpos,"number"],["csid",this._siteSectionCustomId,"string"],["ssid",this._siteSectionId,"string"],["ssnw",this._siteSectionNetworkId,
  "number"],["pvrn",this._siteSectionViewRandom,"number"],["sfid",this._siteSectionFallbackId,"string"],["vcid",this._visitorCustomId,"string"],["mode",this._requestMode,"string"],["vrdu",this._requestDuration,"number"],["ssto",this._subsessionToken,"number"],["cd",this._compatibleDimensions||this.detectScreenDimension(),"string"],["vclr",a.version+(b?","+b:""),"string"],["resp",a.PLATFORM_SEND_REQUEST_BY_FORM?"json2":"json","string"],["orig",window.location.protocol+"//"+window.location.host,"string"],
  ["cbfn","tv.freewheel.SDK._instanceQueue['Context_"+this._context._instanceId+"'].requestComplete","string"],["vip",this._visitorIpV4Address,"string"],["cana",this._candidateAdIds.join(","),"string"]];for(var c=0;c<b.length;c++){var d=b[c];switch(d[2]){case "string":a.Util.isBlank(d[1])||(this._urlParams[d[0]]=encodeURIComponent(d[1]));break;case "number":0<d[1]&&(this._urlParams[d[0]]=d[1]);}}b="";for(var e in this._urlParams)this._urlParams.hasOwnProperty(e)&&(b+=e+"="+this._urlParams[e]+"&");b=
  b.substring(0,b.length-1);0<this._slotScanner._candidateAds.length&&(null==this._capabilities._capabilities[a.CAPABILITY_CHECK_COMPANION]&&this._capabilities.setCapability(a.CAPABILITY_CHECK_COMPANION,a.CAPABILITY_STATUS_ON),null==this._capabilities._capabilities[a.CAPABILITY_CHECK_TARGETING]&&this._capabilities.setCapability(a.CAPABILITY_CHECK_TARGETING,a.CAPABILITY_STATUS_OFF));this._context._videoAsset._eventCallback||this._context._videoAsset._requestedVideoViewUrl||!this._context._videoAsset._id&&
  !this._context._videoAsset._customId||this._context.setCapability(a.CAPABILITY_REQUIRE_VIDEO_CALLBACK,a.CAPABILITY_STATUS_ON);this._capabilities._capabilities[a.CAPABILITY_DISPLAY_REFRESH]&&this._context.setCapability(a.CAPABILITY_REQUIRE_VIDEO_CALLBACK,a.CAPABILITY_STATUS_OFF);b=this._capabilities.parseCapabilities(b);this._context.setCapability(a.CAPABILITY_REQUIRE_VIDEO_CALLBACK,a.CAPABILITY_STATUS_UNSET);switch(this._context._videoAsset._autoPlayType){case a.VIDEO_ASSET_AUTO_PLAY_TYPE_UNATTENDED:e=
  "+play+uapl";break;case a.VIDEO_ASSET_AUTO_PLAY_TYPE_NONE:e="-play";break;default:e="+play-uapl";}return b=b.replace(/flag=/,"flag="+encodeURIComponent(e))},generateKeyValuesStr:function(){a.debug("AdRequest.generateKeyValuesStr");var b=a.Util.flashVersion();b=this._keyValues.concat(["_fw_h_x_flash_version="+encodeURIComponent(b),"_fw_dpr="+(void 0===window.devicePixelRatio?"1":window.devicePixelRatio.toFixed(2).toString())]);for(var c=0;c<this._urlKeyValues.length;c++){var d=this._urlKeyValues[c];
  0>b.indexOf(d)&&b.push(d);}(c=this._context._adManager._location)&&b.push("ltlg="+encodeURIComponent(Math.round(1E4*c.coords.latitude)/1E4+","+Math.round(1E4*c.coords.longitude)/1E4));return b.join("&")},generateSlotsTypeBStr:function(){a.debug("AdRequest.generateSlotsTypeBStr");for(var b="",c=[],d=0;d<this._temporalSlots.length;d++){var e=this._temporalSlots[d];e=[["slid",e.getCustomId(),"string"],["slau",e.getAdUnit(),"string"],["ptgt","a","string"],["tpos",e.getTimePosition(),"number"],["cpsq",
  e.getCuepointSequence(),"number"],["envp",e.getSlotProfile(),"string"],["maxd",e.getMaxDuration(),"number"],["mind",e.getMinDuration(),"number"],["prct",e.getAcceptContentType(),"string"],["sgid",e.getSignalId(),"string"]];for(var f=[],h=0;h<e.length;h++){var g=e[h];switch(g[2]){case "string":a.Util.isBlank(g[1])||f.push(g[0]+"="+encodeURIComponent(g[1]));break;case "number":-1<["cpsq","maxd","mind"].indexOf(g[0])?0<g[1]&&f.push(g[0]+"="+g[1]):0<=g[1]&&f.push(g[0]+"="+g[1]);}}c.push(f.join("&"));}0<
  c.length&&(b=c.join(";")+";");return b+=this._slotScanner.slotsToTypeBStr()},detectScreenDimension:function(){a.debug("AdRequest.detectScreenDimension:",screen.width+","+screen.height);return screen.width+","+screen.height},useTCFAPI:function(){a.debug("AdRequest.useTCFAPI");if(this._context.getParameter(a.PARAMETER_USE_GDPR_TCFAPI)){var b=this._context._adManager._fwGDPR||"",c=this._context._adManager._fwGDPRConsent||"";this.removeKey("_fw_gdpr");this.removeKey("_fw_gdpr_consent");this.addKeyValue("_fw_gdpr",
  b.toString());this.addKeyValue("_fw_gdpr_consent",c);}},useUSPAPI:function(){a.debug("AdRequest.useUSPAPI");if(this._context.getParameter(a.PARAMETER_USE_CCPA_USPAPI)){var b=this._context._adManager._fwUSPString||"";""!=b&&(this.removeKey("_fw_us_privacy"),this.addKeyValue("_fw_us_privacy",b));}}};a.AdInstance=function(b){this._context=b;this._creativeRenditionId=this._creativeId=this._soAdUnit=this._adId=this._slot=null;this._replicaId="";this._primaryCreativeRendition=this._creative=null;this._creativeRenditions=
  [];this._noLoad=!1;this._companionAdInstances=[];this._eventCallbacks=[];this._externalEventCallbackUrlsDictionary={};this._rendererController=new a.RendererController(b,this);this._timer=new a.Timer;this._metr=0;this._state=a.MediaInitState.instance;this._isStartSuccessfully=this._translated=this._isImpressionSent=this._isInitiatedSent=!1;this._lastDurationFromRenderer=-1;this._slotCustomId=this._parentAdInstancesGroup=null;this._isSkipped=!1;this._wrapperCount=0;};a.AdInstance.prototype={};a.AdInstance.prototype.constructor=
  a.AdInstance;a.METR_MASK_QUARTILE=0;a.METR_MASK_MIDPOINT=1;a.METR_MASK_COMPLETE=2;a.METR_MASK_VOLUME=3;a.METR_MASK_SIZE=4;a.METR_MASK_CONTROL=5;a.METR_MASK_REWIND=6;a.METR_MASK_ACCEPT_INVITATION=7;a.METR_MASK_CLOSE=8;a.METR_MASK_MINIMIZE=9;a.METR_MASK_CLICK=10;a.AdInstance._metrDictionary={};a.AdInstance._metrDictionary[a.EVENT_AD_FIRST_QUARTILE]=a.AdInstance._metrDictionary[a.EVENT_AD_THIRD_QUARTILE]=a.AdInstance._metrDictionary[a.EVENT_AD_QUARTILE]=1<<a.METR_MASK_QUARTILE|1<<a.METR_MASK_MIDPOINT|
  1<<a.METR_MASK_COMPLETE;a.AdInstance._metrDictionary[a.EVENT_AD_MIDPOINT]=1<<a.METR_MASK_MIDPOINT|1<<a.METR_MASK_COMPLETE;a.AdInstance._metrDictionary[a.EVENT_AD_COMPLETE]=1<<a.METR_MASK_COMPLETE;a.AdInstance._metrDictionary[a.EVENT_AD_MUTE]=1<<a.METR_MASK_VOLUME;a.AdInstance._metrDictionary[a.EVENT_AD_UNMUTE]=1<<a.METR_MASK_VOLUME;a.AdInstance._metrDictionary[a.EVENT_AD_COLLAPSE]=1<<a.METR_MASK_SIZE;a.AdInstance._metrDictionary[a.EVENT_AD_EXPAND]=1<<a.METR_MASK_SIZE;a.AdInstance._metrDictionary[a.EVENT_AD_PAUSE]=
  1<<a.METR_MASK_CONTROL;a.AdInstance._metrDictionary[a.EVENT_AD_RESUME]=1<<a.METR_MASK_CONTROL;a.AdInstance._metrDictionary[a.EVENT_AD_REWIND]=1<<a.METR_MASK_REWIND;a.AdInstance._metrDictionary[a.EVENT_AD_ACCEPT_INVITATION]=1<<a.METR_MASK_ACCEPT_INVITATION;a.AdInstance._metrDictionary[a.EVENT_AD_CLOSE]=1<<a.METR_MASK_CLOSE;a.AdInstance._metrDictionary[a.EVENT_AD_MINIMIZE]=1<<a.METR_MASK_MINIMIZE;a.AdInstance._metrDictionary[a.EVENT_AD_CLICK]=1<<a.METR_MASK_CLICK;a.Util.mixin(a.AdInstance.prototype,
  {getAdId:function(){return this._adId},getUniversalAdId:function(){return this.getActiveCreativeRendition()?this.getActiveCreativeRendition().getUniversalAdId():null},getSoAdUnit:function(){return this._soAdUnit},getParameter:function(a){var b=[];this._context.getParameter(a)&&b.push(this._context.getParameter(a));this._primaryCreativeRendition.getParameter(a)&&b.push(this._primaryCreativeRendition.getParameter(a));this._creative.getParameter(a)&&b.push(this._creative.getParameter(a));this._slot.getParameter(a)&&
  b.push(this._slot.getParameter(a));return b},getEventCallbackUrls:function(b,c){var d=[],e=c===a.EVENT_TYPE_CLICK,f=c===a.EVENT_TYPE_CLICK_TRACKING;b=a.EventCallback.getEventCallback(this._eventCallbacks,b,f?a.EVENT_TYPE_CLICK:c);if(!b)return d;c={};c[a.INFO_KEY_NEED_EMPTY_CT]=!0;e?b._showBrowser&&d.push(b.getUrl(c)):f?b._showBrowser||d.push(b.getUrl(c)):d.push(b.getUrl(c));e||(d=d.concat(b.getTrackingUrls()));return d},addEventCallbackUrls:function(a,c,d){d&&this._isValidEventNameAndType(a,c)&&(this._externalEventCallbackUrlsDictionary[c+
  "-"+a]=this.getExternalEventCallbackUrls(a,c).concat(d));},setClickThroughUrl:function(b,c){c&&this._isValidEventNameAndType(b,a.EVENT_TYPE_CLICK)&&(b=this.getEventCallback(b,a.EVENT_TYPE_CLICK))&&(a.Util.isParameterInURL(b._url,a.URL_PARAMETER_KEY_CR)||(b._url=b._url+"&"+a.URL_PARAMETER_KEY_CR+"="),b._url=a.Util.setParameterInURL(b._url,a.URL_PARAMETER_KEY_CR,c),b._showBrowser=!0);},addCreativeRendition:function(){var b=new a.CreativeRendition;b.parse({creativeRenditionId:this._creativeRenditionId,
  adReplicaId:this._replicaId,preference:0});b.setBaseUnit(this._creative.getBaseUnit());b.setDuration(this._creative.getDuration());this._creativeRenditions.push(b);this.isPlaceholder()&&(this._noLoad=!1);return b},getRendererController:function(){return this._rendererController},getSlot:function(){this._slot||(this._slot=this._context._adResponse.getSlotByCustomId(this._slotCustomId));return this._slot},getCompanionSlots:function(){for(var a=[],c=0;c<this._companionAdInstances.length;c++)a.push(this._companionAdInstances[c]._slot);
  return a},getActiveCreativeRendition:function(){return this._primaryCreativeRendition},setActiveCreativeRendition:function(b){b?(-1===this._creativeRenditions.indexOf(b)&&this._creativeRenditions.push(b),this._primaryCreativeRendition=b,this._creativeRenditionId=b.getId()):a.warn("AdInstance.setActiveCreativeRendition","rendition is null");},getAllCreativeRenditions:function(){var a=this._creativeRenditions.slice();a.sort(function(a,b){return b.getPreference()-a.getPreference()});var c=a.indexOf(this._primaryCreativeRendition);
  -1<c&&(a.splice(c,1),a.unshift(this._primaryCreativeRendition));return a},getRenderableCreativeRenditions:function(){var a=this._creativeRenditions.slice().sort(function(a,b){return b.getPreference()-a.getPreference()}).filter(function(a){return this._rendererController.rendererMatch(a)},this),c=a.indexOf(this._primaryCreativeRendition);-1<c&&(a.splice(c,1),a.unshift(this._primaryCreativeRendition));return a},getPlayheadTime:function(){var b=-1;if(this._rendererController.getRenderer()&&"function"===
  typeof this._rendererController.getRenderer().getPlayheadTime)try{b=this._rendererController.getRenderer().getPlayheadTime();}catch(c){a.warn("AdInstance.getPlayheadTime",c.description);}return b},getDuration:function(){var a=-1;this._rendererController.getRenderer()&&"function"===typeof this._rendererController.getRenderer().getDuration&&(this._lastDurationFromRenderer=a=this._rendererController.getRenderer().getDuration());-1===a&&(a=-1<this._lastDurationFromRenderer?this._lastDurationFromRenderer:
  this.getActiveCreativeRendition().getDuration());return a},parse:function(b){if(b){this._adId=b.adId||null;this._creativeId=b.creativeId||null;this._creativeRenditionId=b.creativeRenditionId||null;this._replicaId=b.hasOwnProperty("replicaId")?b.replicaId:"";this._noLoad=this._context._adResponse.getAd(this._adId).getNoLoad();this._soAdUnit=this._context._adResponse.getAd(this._adId).getSoAdUnit();this._creative=this._context._adResponse.getCreative(this._adId,this._creativeId);this._creativeRenditions=
  this._creative.getEligibleCreativeRenditionsForAdInstance(this);var c,d;var e=0;for(c=b.eventCallbacks||[];e<c.length;e++){var f=c[e];if(d=a.EventCallback.newEventCallback(this._context,f.name,f.type))d._adInstance=this,d.parse(f),this._eventCallbacks.push(d);}e=0;for(c=b.companionAds||[];e<c.length;++e)(f=c[e])&&f.adSlotCustomId&&(d=new a.AdInstance(this._context),d._slotCustomId=f.adSlotCustomId,d.parse(f),this._companionAdInstances.push(d));e=0;for(c=b.fallbackAds||[];e<c.length;++e)f=c[e],d=new a.AdInstance(this._context),
  this._parentAdInstancesGroup.push(d),d._slot=this._slot,d._parentAdInstancesGroup=this._parentAdInstancesGroup,d.parse(f);0<this._creativeRenditions.length&&(this._primaryCreativeRendition=this._creativeRenditions[0]);}},play:function(){a.log("AdInstance.play "+this._slotCustomId);this._timer.tick();this.processEvent(a.EVENT_AD_IMPRESSION,a.EVENT_TYPE_IMPRESSION);this._isStartSuccessfully||(a.MODULE_TYPE_RENDERER===this._rendererController.getRenderer().info()[a.INFO_KEY_MODULE_TYPE]&&this._context.dispatchEvent(a.EVENT_AD_IMPRESSION,
  {adInstance:this,slotCustomId:this._slotCustomId}),this._isStartSuccessfully=!0);this._state.play(this);if(this._rendererController.getRenderer().info()[a.INFO_KEY_MODULE_TYPE]===a.MODULE_TYPE_RENDERER)for(var b=0;b<this._companionAdInstances.length;b++)this._companionAdInstances[b].isPlaceholder()||this._companionAdInstances[b].getSlot().playCompanionAds(this._companionAdInstances[b]);},pause:function(){a.log("AdInstance.pause "+this._slotCustomId);this._isStartSuccessfully?this._rendererController&&
  this._rendererController.pause():a.log("Ad hasn't started yet. Ignore.");},resume:function(){a.log("AdInstance.resume"+this._slotCustomId);this._isStartSuccessfully?this._rendererController&&this._rendererController.resume():a.log("Ad hasn't started yet. Ignore.");},skip:function(){a.log("AdInstance.skip");"VPAID"!==this.getActiveCreativeRendition().getCreativeApi()?(this._isSkipped=!0,this.processEvent(a.EVENT_AD_SKIPPED,a.EVENT_TYPE_GENERIC),this.stop()):a.log("VPAID creative, skip has been implemented inside of VPAID");},
  stop:function(){a.log("AdInstance.stop");this._rendererController.stop();},fakeComplete:function(){this._slot.getTimePositionClass()===a.TIME_POSITION_CLASS_DISPLAY&&(this._isStartSuccessfully=!1,this._slot.playNextAdInstance());},complete:function(){this._isStartSuccessfully&&(this.processEvent(a.EVENT_AD_IMPRESSION_END,a.EVENT_TYPE_IMPRESSION),a.MODULE_TYPE_RENDERER===this._rendererController.getRenderer().info()[a.INFO_KEY_MODULE_TYPE]&&this._context.dispatchEvent(a.EVENT_AD_IMPRESSION_END,{adInstance:this}));
  this._state.complete(this);this._rendererController._restorePlaceholdersForHybrid();this._rendererController.setRenderer(null);this._isStartSuccessfully=!1;this._slot.playNextAdInstance();},isStarted:function(){return this._isStartSuccessfully},onStartPlaying:function(){a.MODULE_TYPE_RENDERER===this._rendererController.getRenderer().info()[a.INFO_KEY_MODULE_TYPE]?this._isImpressionSent=!0:this._translated=!0;},onCompletePlaying:function(){},onStartReplaying:function(){},onCompleteReplaying:function(){},
  getEventCallback:function(b,c){return a.EventCallback.getEventCallback(this._eventCallbacks,b,c)},processEvent:function(b,c,d,e){var f=!0;c=this.getEventCallback(b,c);b===a.EVENT_AD_IMPRESSION&&this._isStartSuccessfully&&(c=this.getEventCallback(a.EVENT_ERROR,a.EVENT_TYPE_ERROR),d={errorInfo:"Trying to send defaultImpression multiple times"},f=!1);c?e||c.process(d):f=!1;b===a.EVENT_AD_CLICK&&this._context.dispatchEvent(a.EVENT_AD_CLICK,{adInstance:this});if(b!==a.EVENT_AD_IMPRESSION&&b!==a.EVENT_AD_IMPRESSION_END||
  a.MODULE_TYPE_RENDERER===this._rendererController.getRenderer().info()[a.INFO_KEY_MODULE_TYPE])e={subType:b,adInstance:this,slot:this._slot},b===a.EVENT_ERROR&&(e[a.INFO_KEY_ERROR_CODE]=d[a.INFO_KEY_ERROR_CODE],e[a.INFO_KEY_ERROR_INFO]=d[a.INFO_KEY_ERROR_INFO],e[a.INFO_KEY_ERROR_MODULE]=d[a.INFO_KEY_ERROR_MODULE]),b===a.EVENT_AD_MEASUREMENT&&(e[a.INFO_KEY_CONCRETE_EVENT_ID]=d[a.INFO_KEY_CONCRETE_EVENT_ID]),this._context.dispatchEvent(a.EVENT_AD,e);return f},setVolume:function(b){a.debug("AdInstance.setVolume("+
  b+")");this.isStarted()&&"function"===typeof this._rendererController.getRenderer().setVolume&&this._rendererController.getRenderer().setVolume(b);},setMetr:function(b,c){var d=a.AdInstance._metrDictionary[b],e=c;d&&(b===a.EVENT_AD_CLICK&&(e=!c),this._metr=e===a.CAPABILITY_STATUS_ON||!0===e?this._metr|d:this._metr&~d);},getExternalEventCallbackUrls:function(a,c){return (this._externalEventCallbackUrlsDictionary[c+"-"+a]||[]).slice()},reset:function(){this._rendererController.reset();for(var b=0;b<this._companionAdInstances.length;b++){var c=
  this._companionAdInstances[b];c._state!==a.MediaPlayingState.instance&&c._state!==a.MediaReplayingState.instance||c.stop();c._rendererController.reset();}},cloneForTranslation:function(){var b=new a.AdInstance(this._context);b._adId=this._adId;b._creativeId=this._creativeId;b._creative=this._creative.cloneForTranslation();b._creativeRenditionId=this._creativeRenditionId;b._isInitiatedSent=this._isInitiatedSent;b._noLoad=this._noLoad;b._slot=this.getSlot();b._soAdUnit=this.getSoAdUnit();b._replicaId=
  this._replicaId;b._wrapperCount=this._wrapperCount;for(var c=0;c<this._eventCallbacks.length;c++){var d=this._eventCallbacks[c].copy();d._adInstance=b;b._eventCallbacks.push(d);}b._externalEventCallbackUrlsDictionary=a.Util.copy(this._externalEventCallbackUrlsDictionary);for(c=0;c<this._companionAdInstances.length;c++)this._companionAdInstances[c].isPlaceholder()?b._companionAdInstances.push(this._companionAdInstances[c].cloneForTranslation()):b._companionAdInstances.push(this._companionAdInstances[c]);
  return b},isPlaceholder:function(){return this._noLoad},setMediaState:function(a){this._state=a;},_isValidEventNameAndType:function(b,c){return a.Util.isBlank(b)||a.Util.isBlank(c)?!1:c===a.EVENT_TYPE_CLICK||c===a.EVENT_TYPE_CLICK_TRACKING||c===a.EVENT_TYPE_IMPRESSION&&(b===a.EVENT_AD_IMPRESSION||b===a.EVENT_AD_FIRST_QUARTILE||b===a.EVENT_AD_MIDPOINT||b===a.EVENT_AD_THIRD_QUARTILE||b===a.EVENT_AD_COMPLETE)||c===a.EVENT_TYPE_STANDARD&&(b===a.EVENT_AD_PAUSE||b===a.EVENT_AD_RESUME||b===a.EVENT_AD_REWIND||
  b===a.EVENT_AD_MUTE||b===a.EVENT_AD_UNMUTE||b===a.EVENT_AD_COLLAPSE||b===a.EVENT_AD_EXPAND||b===a.EVENT_AD_MINIMIZE||b===a.EVENT_AD_CLOSE||b===a.EVENT_AD_ACCEPT_INVITATION)||c===a.EVENT_TYPE_ERROR&&b===a.EVENT_ERROR},isPlayable:function(){var b=!(this._rendererController.getRendererState()===a.RendererFailedState.instance&&!this._isImpressionSent);if(!b)return a.debug("AdInstance.isPlayable returning false isImpressionSent:",this._isImpressionSent),b;(b=b&&!this._translated)||a.debug("AdInstance.isPlayable returning false translated:",
  this._translated);return b},toString:function(){return "[AdInstance "+this._adId+"]"},getCompanionAdInstances:function(){for(var a=[],c=0;c<this._companionAdInstances.length;++c)this._companionAdInstances[c].isPlaceholder()||a.push(this._companionAdInstances[c]);return a},isRequiredToShow:function(){return this._context._adResponse.getAd(this._adId).isRequiredToShow()},incrementWrapperCount:function(){this._wrapperCount++;},getWrapperCount:function(){return this._wrapperCount}});a.EventDispatcher=function(){this._listeners=
  {};};a.EventDispatcher.prototype={addEventListener:function(a,c){"undefined"===typeof this._listeners[a]&&(this._listeners[a]=[]);this._listeners[a].push(c);},dispatchEvent:function(b){"string"===typeof b&&(b={type:b});b.target||(b.target=this);if(b.type&&this._listeners[b.type]instanceof Array)for(var c=this._listeners[b.type],d=0,e=c.length;d<e;d++)try{c[d]&&c[d].call(this,b);}catch(f){a.warn("EventDispatcher.dispatchEvent",b.type,f);}},removeEventListener:function(a,c){if(this._listeners[a]instanceof
  Array){var b=this._listeners[a];if(null==c)this._listeners[a]=[];else {a=0;for(var e=b.length;a<e;a++)if(b[a]===c){b.splice(a,1);break}}}}};a.EventDispatcher.prototype.constructor=a.EventDispatcher;a.DashRenderer=function(){this._fwDashPlayer=null;this._duration=this._playheadTime=-1;this._dragging=this._stopInvoked=this._isEnded=!1;this._volume=1;this._rendererController=null;this._isBuffering=!1;this._autoPauseAdOnVisibilityChange=!0;this._dashjs=window.tv.freewheel.Dashjs;};a.DashRenderer.prototype=
  {pause:function(){this._rendererController&&this._rendererController.processEvent({name:a.EVENT_AD_PAUSE});this._fwDashPlayer&&!this._fwDashPlayer.isPaused()&&this._fwDashPlayer.pause();},resume:function(){this._rendererController&&this._rendererController.processEvent({name:a.EVENT_AD_RESUME});this._fwDashPlayer&&this._fwDashPlayer.isPaused()&&this._fwDashPlayer.play();},start:function(b){this._rendererController=b;var c=this._rendererController.getAdInstance(),d=c.getSlot(),e=this,f=!1,h=!1,g=!1;
  this._autoPauseAdOnVisibilityChange=this._rendererController.getParameter(a.PARAMETER_AUTO_PAUSE_AD_ONVISIBILITYCHANGE);if(a.PLATFORM_NOT_SUPPORT_VIDEO_AD)this._onRendererFailed(a.ERROR_DEVICE_LIMIT,d.getTimePositionClass());else if(a.PLATFORM_NOT_SUPPORT_MIDROLL_AD&&d.getTimePositionClass()===a.TIME_POSITION_CLASS_MIDROLL)this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"midroll");else if(a.PLATFORM_NOT_SUPPORT_DASH)this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"MPEG-DASH playback not supported on this platform");
  else {a.log("DashRenderer.start",d.getTimePositionClass(),c);var m=this._rendererController.getContentVideoElement(),l=d.getVideoDisplaySize().width,n=d.getVideoDisplaySize().height,q=c.getRenderableCreativeRenditions();b=(b=this._rendererController.getParameter(a.PARAMETER_DESIRED_BITRATE))&&0<Number(b)?Number(b):null;if((l=(n=(new a.RenditionSelector(b||1E3,this._rendererController.getParameter("arWeight")||1,this._rendererController.getParameter("pxWeight")||1,.2)).getBestDashRendition(q,l,n))?
  n.getPrimaryCreativeRenditionAsset():null)&&q.length)if(l.getProxiedUrl()){c.setActiveCreativeRendition(n);a.log("DashRenderer.start selected rendition is:",l.getUrl());this._rendererController.setCapability(a.EVENT_AD_QUARTILE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_MUTE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_PAUSE,a.CAPABILITY_STATUS_ON);var r=!a.PLATFORM_NOT_SUPPORT_CLICK_FOR_VIDEO;r||this._rendererController.setCapability(a.EVENT_AD_CLICK,
  a.CAPABILITY_STATUS_OFF);var u=a.PLATFORM_EVENT_CLICK,I=a.MOBILE_EVENT_DRAG;a.debug("DashRenderer","use content video element");m.controls=!1;var k=this._dashjs.MediaPlayer().create();k.initialize();c=k.getVersion();a.debug("dash.js -v "+k.getVersion()+" loaded");if(0!==a.Util.compareVersion(c,a.PLATFORM_DASHJS_SUPPORTED_VERSION))this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"Unsupported tv.freewheel.Dash.js version");else {k.setAutoPlay(!1);k.attachView(m);b&&k.updateSettings({streaming:{abr:{initialBitrate:{video:b}}}});
  k.attachSource(l.getUrl());k.preload();this._fwDashPlayer=k;var z=null,J=null,O=null;this._volume=this._rendererController.getContext().getAdVolume();k.setVolume(this._volume);k.setMute(0===this._volume);var P=function(b){a.debug("DashRenderer.checkTimeUpdate timeout");M(b);},w=function(){J&&(clearTimeout(J),J=null);},L=a.Util.bind(this,function(b){a.debug("onAdVideoPlaybackStalled(): Ad video event "+b.type);b=this._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_PLAY_AFTER_STALLED);null!==
  b&&"undefined"!==typeof b&&!1!==a.Util.str2bool(b)&&(a.debug("play the ad immediately after the stalled event"),k&&k._fw_videoAdPlaying&&k.play());}),t=function(b){e._isBuffering||(e._isBuffering=!0,e._rendererController.processEvent({name:a.EVENT_AD_BUFFERING_START}),a.debug("onAdVideoBufferingStarted(): Ad video event "+b.type));},C=function(b){e._isBuffering&&(e._isBuffering=!1,e._rendererController.processEvent({name:a.EVENT_AD_BUFFERING_END}),a.debug("onAdVideoBufferingEnded(): Ad video event "+
  b.type));};b=this._rendererController.getParameter(a.PARAMETER_EXTENSION_AD_CONTROL_CLICK_ELEMENT);var E=null;b&&(E=document.getElementById(b));E||(E=m);var x=a.Util.bind(this,function(b){if(k.isPaused()&&a.PLATFORM_NOT_FIRE_CLICK_WHEN_AD_VIDEO_PAUSED)k.play();else {var c=this._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_CLICK_DETECTION);null==c&&(c="true");!1!==a.Util.str2bool(c)&&(h?(a.debug("Ad video event "+b.type),this._dragging?this._dragging=!1:this._rendererController.processEvent({name:a.EVENT_AD_CLICK})):
  a.debug("Ad not started, ignore click."));}}),v=a.Util.bind(this,function(b){a.debug("Ad video event "+b.type);this._dragging=!0;}),F,H=function(b){a.debug("Ad video event "+b.type+" ended: "+m.ended+" playing: "+k._fw_videoAdPlaying);b=e._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_DISPLAY_CONTROLS_WHEN_PAUSE);null==b&&(b="true");!1===a.Util.str2bool(b)?a.debug("Pause controls disabled"):m.controls=!0;w();},Q=function(b){a.debug("Ad video event "+b.type);m.controls=!1;},D=0,G=function(b){a.debug("Ad video event "+
  b.type);0>=k.time()?a.debug("DashRenderer.onAdVideoTimeUpdate currentTime is less than or 0"):(w(),k.isPaused()||(b=e._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_PROGRESS_DETECT_TIMEOUT)||8E3,J=setTimeout(P,b,b+"ms timeout when playing")),h||(h=!0,e._playheadTime=k.time(),0>e._playheadTime&&(e._playheadTime=0),z&&(clearTimeout(z),z=null),e._quartileTimerId=setInterval(function(){var b=k.time(),c=k.duration();0<b&&(e._playheadTime=b);0<c&&(e._duration=c);"number"!==typeof b||"number"!==
  typeof c||O||(b>=.25*c&&1>D&&(e._rendererController.processEvent({name:a.EVENT_AD_FIRST_QUARTILE}),D=1),b>=.5*c&&2>D&&(e._rendererController.processEvent({name:a.EVENT_AD_MIDPOINT}),D=2),b>=.75*c&&3>D&&(clearInterval(e._quartileTimerId),e._quartileTimerId=null,e._rendererController.processEvent({name:a.EVENT_AD_THIRD_QUARTILE}),D=3));},1E3),e._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED)));};this.dispose=a.Util.bind(this,function(){R();});var R=function(b){e.playAdAfterStartDelay&&
  (clearTimeout(e.playAdAfterStartDelay),e.playAdAfterStartDelay=null);var c=O;b&&b.type&&(a.debug("DashRenderer onAdVideoEnded. Ad video event: "+b.type),"error"===b.type&&b.target&&(a.warn(b.target.src),a.warn(b.target.currentSrc),C(b)));w();z&&(clearTimeout(z),z=null);r&&(E.removeEventListener(u,x,!1),E.removeEventListener(I,v,!1));F&&(clearTimeout(F),F=null);A&&e._autoPauseAdOnVisibilityChange&&(document.removeEventListener("visibilitychange",A,!1),A=null);var d=e._dashjs.MediaPlayer.events;k.off(d.PLAYBACK_ENDED,
  R,e);k.off(d.PLAYBACK_ERROR,R,e);k.off(d.ERROR,R,e);k.off(d.PLAYBACK_PAUSED,H,e);k.off(d.PLAYBACK_PLAYING,Q,e);k.off(d.PLAYBACK_TIME_UPDATED,G,e);k.off(d.PLAYBACK_STALLED,L,e);k.off(d.BUFFER_EMPTY,t,e);k.off(d.BUFFER_LOADED,C,e);k.off(d.PLAYBACK_NOT_ALLOWED,K,e);k.isPaused()||(a.debug("try pausing video before complete"),k.pause());b&&"error"===b.type&&b.target?(c="video error",(b=m.error||b.target.error)&&(c="error:"+b+",code:"+b.code)):b&&"error"===b.type&&b.error?c="dashjs error, dashjs-error-message: "+
  b.error.message+", dashjs-error-code: "+b.error.code:b&&"playbackError"===b.type&&b.error&&(c="dashjs playbackError");c||(e._isEnded=!0);a.log("DashRenderer.complete");if(!f){f=!0;delete k._fw_videoAdPlaying;b=k.time();d=k.duration();e._fwDashPlayer=null;try{k.reset();}catch(y){a.warn("Error resetting fw dashjs player: ",y);}k=null;e._quartileTimerId&&(clearInterval(e._quartileTimerId),e._quartileTimerId=null);c?(b=null,c.includes("timeout")?b=a.ERROR_TIMEOUT:c.includes("dashjs")&&(b=a.ERROR_DASHJS),
  e._onRendererFailed(b,c)):(e._stopInvoked||(b>=.25*d&&1>D&&(e._rendererController.processEvent({name:a.EVENT_AD_FIRST_QUARTILE}),D=1),b>=.5*d&&2>D&&(e._rendererController.processEvent({name:a.EVENT_AD_MIDPOINT}),D=2),b>=.75*d&&3>D&&(e._rendererController.processEvent({name:a.EVENT_AD_THIRD_QUARTILE}),D=3),b>=d-.5&&4>D&&(e._rendererController.processEvent({name:a.EVENT_AD_COMPLETE}),D=4)),e._stopInvoked=!1,e._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED));}e._rendererController=
  null;};var M=function(b){O=b;a.warn(O);a.PLATFORM_WAIT_WHEN_AD_VIDEO_TIMEOUT||R();},A=function(b){a.log("onVisibilityChange:"+(document.hidden?"invisible":"visible"));document.hidden?k&&!k.isPaused()&&(k.pause(),g=!0,e._rendererController&&e._rendererController.processEvent({name:a.EVENT_AD_PAUSE}),z&&(clearTimeout(z),z=null)):k&&(k.isPaused()||null===k.isPaused())&&g&&(k.play(),g=!1,e._rendererController&&e._rendererController.processEvent({name:a.EVENT_AD_RESUME}),h||!k._fw_fromVideoPool&&!a.PLATFORM_SUPPORT_VIDEO_START_DETECT_TIMEOUT||
  (b=e._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_START_DETECT_TIMEOUT)||5E3,z=setTimeout(M,b,b+"ms timeout before playing")));},K=function(){a.warn("Blocked by browser, need player to display a start button");e._fwDashPlayer.off(e._dashjs.MediaPlayer.events.PLAYBACK_NOT_ALLOWED,K,e);z&&(clearTimeout(z),z=null);d.setAutoPlayBlocked(!0);e._rendererController.processEvent({name:a.EVENT_AD_AUTO_PLAY_BLOCKED,info:{apiOnly:!0}});};k._fw_videoAdPlaying=!0;var T=!1;(function(){if(!T){T=!0;r&&
  (E.addEventListener(u,x,!1),E.addEventListener(I,v,!1));var b=e._dashjs.MediaPlayer.events;k.on(b.PLAYBACK_ENDED,R,e);k.on(b.PLAYBACK_ERROR,R,e);k.on(b.ERROR,R,e);k.on(b.PLAYBACK_PAUSED,H,e);k.on(b.PLAYBACK_PLAYING,Q,e);k.on(b.PLAYBACK_TIME_UPDATED,G,e);k.on(b.PLAYBACK_STALLED,L,e);k.on(b.BUFFER_EMPTY,t,e);k.on(b.BUFFER_LOADED,C,e);k.on(b.PLAYBACK_NOT_ALLOWED,K,e);a.log("DashRenderer, play video ad "+k.getSource());if(k._fw_fromVideoPool||a.PLATFORM_SUPPORT_VIDEO_START_DETECT_TIMEOUT)b=e._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_START_DETECT_TIMEOUT)||
  5E3,z=setTimeout(M,b,b+"ms timeout before playing");a.PLATFORM_VIDEO_DOESNOT_SUPPORT_TIMEUPDATE&&e._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED);b=100;0<a.PLATFORM_ANDROID_VERSION&&(b=e._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_ANDROID_DELAY)||100);e.playAdAfterStartDelay=setTimeout(function(){e.playAdAfterStartDelay=null;document.hidden&&e._autoPauseAdOnVisibilityChange?(a.log("DashRenderer pause ad when tab is invisible."),g=!0,k&&k.pause(),e._rendererController&&
  e._rendererController.processEvent({name:a.EVENT_AD_PAUSE}),z&&(clearTimeout(z),z=null)):k.play();},b);e._autoPauseAdOnVisibilityChange&&document.addEventListener("visibilitychange",A,!1);}})();}}else this._onRendererFailed(a.ERROR_NULL_ASSET);else this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"no compatible asset");}},stop:function(){a.debug("DashRenderer stop");this._stopInvoked=!0;this._fwDashPlayer&&(this._fwDashPlayer._fw_videoAdPlaying=!1,this._fwDashPlayer.pause(),this.dispose());this._rendererController=
  null;},info:function(){return {moduleType:a.MODULE_TYPE_RENDERER}},getPlayheadTime:function(){if(this._isEnded&&0<this._duration)return this._duration;if(this._fwDashPlayer){var a=this._fwDashPlayer.time();if(0<a)return a}return this._playheadTime},getDuration:function(){return this._duration},setVolume:function(b){a.debug("DashRenderer setVolume("+b+")");this._fwDashPlayer?(this._fwDashPlayer.setVolume(b),this._fwDashPlayer.setMute(0===b),this._volume!==b&&this._rendererController.processEvent({name:a.EVENT_AD_VOLUME_CHANGE}),
  0===this._volume&&0!==b?this._rendererController.processEvent({name:a.EVENT_AD_UNMUTE}):0!==this._volume&&0===b&&this._rendererController.processEvent({name:a.EVENT_AD_MUTE}),this._volume=b):a.debug("DashRenderer ad video is null, ignore.");},_onRendererFailed:function(b,c,d){var e={};e[a.INFO_KEY_ERROR_MODULE]="DashRenderer";e[a.INFO_KEY_ERROR_CODE]=b;d||(d=a.ERROR_VAST_GENERAL_LINEAR_ERROR);e[a.INFO_KEY_VAST_ERROR_CODE]=d;c&&(e[a.INFO_KEY_ERROR_INFO]=c);this._rendererController.handleStateTransition(a.RENDERER_STATE_FAILED,
  e);}};a.DashRenderer.prototype.constructor=a.DashRenderer;a.HTMLAdGenerator={log:function(b){a.log("HTMLAdGenerator\t"+b);},getExtension:function(a){return a?(a=a.match(/^[^?]+\/[^?.]*(\.\w+)+/))?a[a.length-1].slice(1):"":""},generateAd:function(b,c,d,e,f,h,g){a.HTMLAdGenerator.log("generatorAd("+[].slice.call(arguments,0).join(",")+")");var m=h,l=!1;null==m&&(l=!0,m=a.HTMLAdGenerator.getExtension(b).toLowerCase());switch(m){case "jpeg":case "jpg":case "gif":case "png":case "image/jpeg":case "image/jpg":case "image/gif":case "image/png":case "image/bmp":m=
  a.HTMLAdGenerator.generateImageHTML(b,c);break;case "swf":case "application/x-shockwave-flash":m=a.HTMLAdGenerator.generateFlashHTML(b,c,d,e,f);break;case "script":case "js":case "text/javascript":case "text/js_ref":case "application/x-javascript":m=a.HTMLAdGenerator.generateScriptHTML(b,d,e,f);break;case "iframe":case "html":case "htm":case "text/html":case "text/html_doc_ref":case "text/html_lit_nowrapper":case "text/html_doc_lit_mobile":m=a.HTMLAdGenerator.generateIFrameHTML(b,c,d,e,f);break;default:m=
  l?a.HTMLAdGenerator.generateIFrameHTML(b,c,d,e,f):a.HTMLAdGenerator.generateAd(b,c,d,e,f,null,g);}return "text/html_doc_lit_mobile"===g?a.HTMLAdGenerator.htmlLitToHTMLDocLitMobile(m):m},generateImageHTML:function(b,c){a.HTMLAdGenerator.log("generateImageHTML");return c?'<a rel="noopener noreferrer" href="'+c+'" target="_blank"><img src="'+b+'" border="0" /></a>':'<img src="'+b+'" border="0" />'},generateFlashHTML:function(b,c,d,e,f){a.HTMLAdGenerator.log("generateFlashHTML");var h=b;c&&0<c.length&&
  (h+=-1===b.indexOf("?")?"?":"&",h+="clickTag="+encodeURIComponent(c));b='<OBJECT classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0"WIDTH="'+e+'" HEIGHT="'+f+'" id="'+d+'_external_ad">'+('<PARAM NAME=movie VALUE="'+h+'"/>')+'<PARAM NAME=quality VALUE=high/><PARAM NAME=bgcolor VALUE=#FFFFFF/><PARAM NAME="allowScriptAccess" VALUE="always"/><PARAM NAME="loop" VALUE="true"/>';b+='<EMBED src="'+h+'" ';return b+
  ('quality=high bgcolor=#FFFFFF WIDTH="'+e+'" HEIGHT="'+f+'"NAME="'+d+'_external_video" ALIGN="" TYPE="application/x-shockwave-flash"PLUGINSPAGE="http://www.macromedia.com/go/getflashplayer"></EMBED></OBJECT>')},generateIFrameHTML:function(b,c,d,e,f){a.HTMLAdGenerator.log("generateIFrameHTML");return '<iframe height="'+f+'" width="'+e+'" frameborder="0" scrolling="no" allowtransparency="true" leftmargin="0" rightmargin="0" marginwidth="0" marginheight="0" src="'+b+'"></iframe>'},docLitToHTMLLit:function(b,
  c,d,e){a.HTMLAdGenerator.log("docLitToHTMLLit");return '<iframe id="_fw_frame_'+c+'" width="'+d+'" height="'+e+'" marginwidth="0" marginheight="0" frameborder="0" scrolling="no"></iframe><script language="javascript" type="text/javascript" id="_fw_container_js_'+c+"\">if(!fw_targets) {var fw_targets = [];}var _fw_wr;var fw_scope = document;var fw_content = '"+a.Util.encodeToHex(b)+"';var trgtFrm = fw_scope.getElementById(\"_fw_frame_"+c+'");trgtFrm = (trgtFrm.contentWindow) ? trgtFrm.contentWindow : (trgtFrm.contentDocument.document) ? trgtFrm.contentDocument.document : trgtFrm.contentDocument;fw_targets["'+
  c+'"] = trgtFrm;if(navigator.userAgent.match(/\\bMSIE\\b/) || navigator.userAgent.match(/\\bOpera\\b/)){trgtFrm.document.open();trgtFrm.document.write(fw_content);setTimeout(function(){fw_close(fw_targets["'+c+'"])}, 7500);} else if (navigator.userAgent.match(/\\bFirefox\\b/)) {if(true && fw_content.length < 2000){var ec = escape(fw_content);var fw_iframe_url = "http://m2.feiwei.tv/g/lib/template/echo.html?s="+ec;fw_scope.getElementById("_fw_frame_'+c+'").src = fw_iframe_url;} else {trgtFrm.document.open();trgtFrm.document.write(fw_content);trgtFrm.document.close();}} else {trgtFrm.document.open();trgtFrm.document.write(fw_content);trgtFrm.document.close();}function fw_close(theFrame){theFrame.document.close();}\x3c/script>'},
  htmlLitToDocLit:function(b){a.HTMLAdGenerator.log("htmlLitToDocLit");return '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"><html><head><title>Advertisement</title></head><body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">'+b+"</body></html>"},wrapUnsafeHTML:function(b,c,d,e){return a.HTMLAdGenerator.htmlLitToHTMLDocLitMobile(a.HTMLAdGenerator.docLitToHTMLLit(a.HTMLAdGenerator.htmlLitToDocLit(b),c,d,e))},wrapJSCode:function(b,
  c,d,e){return a.HTMLAdGenerator.wrapUnsafeHTML('<script language="javascript" type="text/javascript">'+b+"\x3c/script>",c,d,e)},generateScriptHTML:function(b,c,d,e){a.HTMLAdGenerator.log("generateScriptHTML");return a.HTMLAdGenerator.wrapUnsafeHTML('<script language="javascript" type="text/javascript" src="'+b+'">\x3c/script>',c,d,e)},htmlLitToHTMLDocLitMobile:function(b){a.HTMLAdGenerator.log("htmlLitToHTMLDocLitMobile");return '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"><html><head><meta name = "viewport" content = "initial-scale = 1.0, target-densitydpi = device-dpi" /><title>Advertisement</title><script type="text/javascript">window._fw_page_url = "";\x3c/script></head><body style="margin:0px;background-color:transparent;">'+
  b+"</body></html>"}};a.RenditionSelector=function(a,c,d,e){this._targetByterate=a;this._arWeight=c;this._pxWeight=d;this._conversionFactor=e;};a.RenditionSelector.prototype={getBestFitRendition:function(b,c,d){var e=this;b.reverse();b=b.filter(function(b){return b&&b.getPrimaryCreativeRenditionAsset()&&(b.getPrimaryCreativeRenditionAsset().getProxiedUrl()||b.getPrimaryCreativeRenditionAsset().getContent())&&a.Util.canPlayVideoType(b.getPrimaryCreativeRenditionAsset().getMimeType())}).sort(function(a,
  b){return e.getBitrate(a)-e.getBitrate(b)});return b.length?this._getBitRateFilteredRenditions(b,c,d,e):null},getLightningBestFitRendition:function(a,c,d){var b=this;a.reverse();a=a.filter(function(a){return a&&a.getPrimaryCreativeRenditionAsset()&&(a.getPrimaryCreativeRenditionAsset().getProxiedUrl()||a.getPrimaryCreativeRenditionAsset().getContent())}).sort(function(a,c){return b.getBitrate(a)-b.getBitrate(c)});return a.length?this._getBitRateFilteredRenditions(a,c,d,b):null},_getBitRateFilteredRenditions:function(a,
  c,d,e){var b=Number.MAX_VALUE,h=a.filter(function(a){a=e.getBitrate(a);b=a<b?a:b;return a<=e._targetByterate});h.length||(h=a.filter(function(a){return e.getBitrate(a)<=b}));return h.sort(function(a,b){return e.compareVisualMetrics(a,b,c,d)}).pop()},getBestDashRendition:function(a,c,d){var b=this;a.reverse();return a.sort(function(a,e){return b.compareVisualMetrics(a,e,c,d)})[a.length-1]},compareVisualMetrics:function(a,c,d,e){var b=this.calculateVisualRatios(a.getWidth(),a.getHeight(),d,e);e=this.calculateVisualRatios(c.getWidth(),
  c.getHeight(),d,e);return !b&&e?-1:b&&!e?1:b&&e&&(d=this._conversionFactor*this._arWeight*Math.log(e.arRatio),e=this._pxWeight*Math.log(e.pixelation),b=this.findDistance(this._conversionFactor*this._arWeight*Math.log(b.arRatio),this._pxWeight*Math.log(b.pixelation),0,0),d=this.findDistance(d,e,0,0),d!==b)?d-b:a.getPreference()-c.getPreference()},calculateVisualRatios:function(a,c,d,e){if(0<a&&0<c&&0<d&&0<e){var b=a/c,h=d/e;b>h?e=d/b:d=e*b;return {arRatio:b/h,pixelation:a*c/(d*e)}}return null},findDistance:function(a,
  c,d,e){return isNaN(a)||isNaN(d)||isNaN(c)||isNaN(e)?NaN:Math.sqrt(Math.pow(d-a,2)+Math.pow(e-c,2))},getBitrate:function(a){var b=a.getDuration();return (a=a.getPrimaryCreativeRenditionAsset().getBytes())&&b&&!isNaN(a)&&!isNaN(b)&&0<a&&0<b?8*a/1E3/b:-1}};a.RenditionSelector.prototype.constructor=a.RenditionSelector;a.LightningRenderer=function(){this._adListener=this._customPlayer=this._rendererController=null;this._quartileSent=0;this._isPaused=this._isStarted=!1;this._timeoutTracker=null;this._lastPlayheadTime=
  0;this._timeUpdatePollingIntervalInMs=250;};a.LightningRenderer.prototype={pause:function(){this._isPaused=!0;this._rendererController&&this._rendererController.processEvent({name:a.EVENT_AD_PAUSE});this._customPlayer&&this._customPlayer.playPause(!0);},resume:function(){this._isPaused=!1;this._rendererController&&this._rendererController.processEvent({name:a.EVENT_AD_RESUME});this._customPlayer&&this._customPlayer.playPause(!1);},start:function(b){this._rendererController=b;if(this._customPlayer=this._rendererController.getCustomPlayer()){b=
  this._rendererController.getAdInstance();var c=b.getSlot();a.log("LightningRenderer.start",c.getTimePositionClass(),b);var d=c.getVideoDisplaySize().width,e=c.getVideoDisplaySize().height;c=b.getRenderableCreativeRenditions();(d=(e=(new a.RenditionSelector(this._rendererController.getParameter(a.PARAMETER_DESIRED_BITRATE)||1E3,this._rendererController.getParameter("arWeight")||1,this._rendererController.getParameter("pxWeight")||1,.2)).getLightningBestFitRendition(c,d,e))?e.getPrimaryCreativeRenditionAsset():
  null)&&c.length?(c=d.getProxiedUrl())?(b.setActiveCreativeRendition(e),a.log("LightningRenderer.start selected rendition is:",c),this._rendererController.setCapability(a.EVENT_AD_QUARTILE,a.CAPABILITY_STATUS_ON),this._rendererController.setCapability(a.EVENT_AD_MUTE,a.CAPABILITY_STATUS_ON),this._rendererController.setCapability(a.EVENT_AD_PAUSE,a.CAPABILITY_STATUS_ON),this._rendererController.setCapability(a.EVENT_AD_CLICK,a.CAPABILITY_STATUS_OFF),this._adListener=new a.AdListener(this),b=this._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_START_DETECT_TIMEOUT)||
  5E3,this._progressTimeoutInMs=this._rendererController.getParameter(a.PARAMETER_RENDERER_VIDEO_PROGRESS_DETECT_TIMEOUT)||8E3,this._onTimeout=a.Util.bind(this,function(a){this._adListener.onError(a);}),this._timeoutTracker=setTimeout(this._onTimeout,b,b+" ms custom player timeout before playing"),this._quartileTimerId=setInterval(a.Util.bind(this,this._pollForAdVideoTimeUpdate),this._timeUpdatePollingIntervalInMs),b=d.getProxiedUrl(),a.log("LightningRenderer will play video ad: "+b),this._customPlayer.open(b,
  this._adListener)):this._onRendererFailed(a.ERROR_NULL_ASSET):this._onRendererFailed(a.ERROR_DEVICE_LIMIT,"no compatible asset");}else this._onRendererFailed(a.ERROR_UNKNOWN,"custom player was null");},_pollForAdVideoTimeUpdate:function(){var b=this._customPlayer.getPlayheadTime(),c=this._customPlayer.getDuration();"number"===typeof b&&"number"===typeof c&&(0>=b||0>=c?a.debug("LightningRenderer._pollForAdVideoTimeUpdate currentTime or duration is less than or 0"):(this._isStarted||(this._isStarted=
  !0,this._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED)),b>this._lastPlayheadTime&&(this._clearTimeoutTracker(),this._lastPlayheadTime=b,this._isPaused||(this._timeoutTracker=setTimeout(this._onTimeout,this._progressTimeoutInMs,this._progressTimeoutInMs+" ms custom player timeout when playing"))),b>=.25*c&&1>this._quartileSent&&(this._quartileSent=1,this._rendererController.processEvent({name:a.EVENT_AD_FIRST_QUARTILE})),b>=.5*c&&2>this._quartileSent&&(this._quartileSent=2,this._rendererController.processEvent({name:a.EVENT_AD_MIDPOINT})),
  b>=.75*c&&3>this._quartileSent&&(this._quartileSent=3,this._rendererController.processEvent({name:a.EVENT_AD_THIRD_QUARTILE})),b>=c-.5&&4>this._quartileSent&&(this._quartileSent=4,this._rendererController.processEvent({name:a.EVENT_AD_COMPLETE}))));},_onEnded:function(b){this._clearTimeoutTracker();this._clearQuartileTimer();this._customPlayer=null;this._adListener=this._adListener._lightningRenderer=null;if(b){var c=a.ERROR_CUSTOM_PLAYER;b.includes("timeout")&&(c=a.ERROR_TIMEOUT);this._onRendererFailed(c,
  b);}else this._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED);this._rendererController=null;},stop:function(){a.log("LightningRenderer.stop");this._customPlayer&&this._customPlayer.playPause(!0);this._pollForAdVideoTimeUpdate();this._onEnded();},info:function(){return {moduleType:a.MODULE_TYPE_RENDERER}},getPlayheadTime:function(){return this._customPlayer?this._customPlayer.getPlayheadTime():-1},getDuration:function(){return this._customPlayer?this._customPlayer.getDuration():-1},
  setVolume:function(b){a.warn("setVolume is not supported at this time");},_clearTimeoutTracker:function(){this._timeoutTracker&&(clearTimeout(this._timeoutTracker),this._timeoutTracker=null);},_clearQuartileTimer:function(){this._quartileTimerId&&(clearInterval(this._quartileTimerId),this._quartileTimerId=null);},_onRendererFailed:function(b,c){var d={};d[a.INFO_KEY_ERROR_MODULE]="LightningRenderer";d[a.INFO_KEY_ERROR_CODE]=b;c&&(d[a.INFO_KEY_ERROR_INFO]=c);this._rendererController.handleStateTransition(a.RENDERER_STATE_FAILED,
  d);}};a.LightningRenderer.prototype.constructor=a.LightningRenderer;a.AdListener=function(a){this._lightningRenderer=a;};a.AdListener.prototype={onEnded:function(){this._lightningRenderer._onEnded();},onError:function(b){a.warn(b);this._lightningRenderer._onEnded(b);}};a.AdListener.prototype.constructor=a.AdListener;a.PageSlotScanner=function(a){this.OPTION_INIT=1;this.OPTION_FCAI=2;this.OPTION_NIIC=4;this.OPTION_NOSA=8;this.OPTION_NSIT=16;this._knownSlots=[];this._slots={};this._candidateAds=[];this._slotOptionFound=
  !1;this._context=a;};a.PageSlotScanner.prototype={isSlotDuplicate:function(a){for(var b=0;b<this._knownSlots.length;++b)if(this._knownSlots[b].id===a)return !0;return !1},findPageSlotByScope:function(b){var c=b.document;if(c){var d=/(^|\s)_fwph(\s|$)/,e=c.getElementsByTagName("span");b._fw_admanager||(b._fw_admanager={});b._fw_admanager.pageScanState=!0;for(b=0;b<e.length;++b){var f;var h=e[b];if(d.test(h.className)&&(h=h.getAttribute("id"),(f=c.getElementById("_fw_input_"+h))&&!this.isSlotDuplicate(h)&&
  (f=f.getAttribute("value")))){";"!==f.charAt(f.length-1)&&(f+=";");f=f.split(";");var g=f[f.length-2],m=!1;-1!==g.search("lo=i")&&(m=!0);var l=!1;-1!==g.search("prct=")&&(l=!0);0>g.search("flag=")&&(g+="&flag=");0>g.search("ptgt=")&&(g="ptgt=s&"+g);f=[];var n=g.split("&"),q,r;g=!0;for(var u=a.SLOT_OPTION_INITIAL_AD_STAND_ALONE,I=0;I<n.length;++I){var k=n[I].split("=");if(2===k.length){k[1]=decodeURIComponent(k[1]);if("ssct"===k[0])if(l)continue;else l=!0,k[0]="prct";"flag"===k[0]?(-1===k[1].search(/[-\+]cmpn/)&&
  (k[1]+="+cmpn"),"+"!==k[1].charAt(0)&&"-"!==k[1].charAt(0)&&(k[1]="+"+k[1]),m&&-1===k[1].search("-init")&&(k[1]+="-init"),-1!==k[1].search("-nrpl")&&(k[1]=k[1].replace("-nrpl","+cmpn")),-1!==k[1].search("-cmpn")&&(g=!1),u=this._getInitialOption(k[1]),this._slotOptionFound||(u=m?a.SLOT_OPTION_INITIAL_AD_KEEP_ORIGINAL:a.SLOT_OPTION_INITIAL_AD_STAND_ALONE)):"w"===k[0]?q=Number(k[1]):"h"===k[0]?r=Number(k[1]):"cana"===k[0]&&this._addCandidateAds(k[1]);k=encodeURIComponent(k[0])+"="+encodeURIComponent(k[1]);
  f.push(k);}}l||""==this._context.getParameter(a.PARAMETER_PAGE_SLOT_CONTENT_TYPE)||(m=this._context.getParameter(a.PARAMETER_PAGE_SLOT_CONTENT_TYPE)||"text/html_doc_lit_mobile,text/html_doc_ref",f.push("prct="+encodeURIComponent(m)));(m=c.getElementById("_fw_container_"+h))?(this._slots[h]=f.join("&")+";",this._knownSlots.push({id:h,width:q,height:r,element:m,acceptCompanion:g,initialAdOption:u})):a.warn("Failed to find container for slot "+h);}}}},scanPageSlots:function(){for(var b=0;b<window.frames.length;++b)try{a.debug("scanPageSlots in frame",
  b),this.findPageSlotByScope(window.frames[b]);}catch(c){a.debug("PageSlotScanner: scanPageSlots exception "+c);}try{window.parent&&window.parent!==window&&(a.debug("scanPageSlots in parent frame"),this.findPageSlotByScope(window.parent));}catch(c){a.debug("PageSlotScanner: scanPageSlots exception "+c);}try{a.debug("scanPageSlots in current window"),this.findPageSlotByScope(window);}catch(c){a.debug("PageSlotScanner: scanPageSlots exception "+c);}},slotsToTypeBStr:function(){var a="",c;for(c in this._slots)if(this._slots.hasOwnProperty(c)){var d=
  this._slots[c];-1===d.search("slid=")&&(d="slid="+encodeURIComponent(c)+"&"+d);a+=d;";"!==a.charAt(a.length-1)&&(a+=";");}a&&(a=a.substring(0,a.length-1));return a},_addCandidateAds:function(a){a=a.split(",");for(var b=0;b<a.length;b++){var d=parseInt(a[b],10);0<d&&this._candidateAds.push(d);}},_parseFlags:function(a){var b=[],d=[],e="",f=!0;a+="+";for(var h=0;h<a.length;++h){var g=a.charAt(h);switch(g){case "+":case "-":""!==e&&((f?b:d).push(e),e="");f="+"===g;break;default:e+=g;}}return [b,d]},_getInitialOption:function(b){var c=
  !0,d=!1,e=0;b=this._parseFlags(b);for(var f=a.SLOT_OPTION_INITIAL_AD_STAND_ALONE,h=0;h<b.length;++h)for(var g=0;g<b[h].length;++g)switch(b[h][g].toString().toLowerCase()){case "cmpn":c=0===h;break;case "nrpl":c=0!==h;break;case "init":e=0===h?e&~this.OPTION_INIT:e|this.OPTION_INIT;d=!0;break;case "fcai":e=0===h?e|this.OPTION_FCAI:e&~this.OPTION_FCAI;d=!0;break;case "niic":e=0===h?e|this.OPTION_NIIC:e&~this.OPTION_NIIC;d=!0;break;case "nosa":e=0===h?e|this.OPTION_NOSA:e&~this.OPTION_NOSA;d=!0;break;
  case "nsit":e=0===h?e|this.OPTION_NSIT:e&~this.OPTION_NSIT,d=!0;}a.debug("PageSlotScanner: _getInitialOption: acceptCompanion = "+c);switch(e){case 0:d&&(f=a.SLOT_OPTION_INITIAL_AD_STAND_ALONE);break;case 1:f=a.SLOT_OPTION_INITIAL_AD_KEEP_ORIGINAL;break;case 3:f=a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_ONLY;break;case 2:f=a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_STAND_ALONE;break;case 6:f=a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_THEN_STAND_ALONE;break;case 8:f=a.SLOT_OPTION_INITIAL_AD_NO_STAND_ALONE;
  break;case 10:f=a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_NO_STAND_ALONE;break;case 16:f=a.SLOT_OPTION_INITIAL_AD_NO_STAND_ALONE_IF_TEMPORAL;break;case 18:f=a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_NO_STAND_ALONE_IF_TEMPORAL;break;default:f=a.SLOT_OPTION_INITIAL_AD_STAND_ALONE;}this._slotOptionFound=d;return f}};a.PageSlotScanner.prototype.constructor=a.PageSlotScanner;a.DisplayRefreshExtension=function(){this.REFRESH_TYPE_NONE="refresh_none";this.REFRESH_TYPE_AD="refresh_ad";this.REFRESH_TYPE_TIME=
  "refresh_time";this.REPLACE_TYPE_NONE="replace_none";this.REPLACE_TYPE_BLANK="replace_blank";this.REPLACE_TYPE_AD="replace_ad";this._subContext=null;this._displaySlots=[];this._companionSlots=[];this._keyValues=[];this._globalParameters=[];this._overrideParameters=[];this._refreshType=this.REFRESH_TYPE_NONE;this._replaceType=this.REPLACE_TYPE_NONE;this._refreshInterval=0;this._refreshTimer=null;this._firstTemporalAd=!0;this._REQUEST_TIME_OUT=5;};a.DisplayRefreshExtension.prototype={init:function(b){this._context=
  b;a.debug("DisplayRefreshExtension.init(context)");this._onRendererEvent=a.Util.bind(this,function(b){a.debug("DisplayRefreshExtension._onRendererEvent()");b.subType===a.EVENT_AD_IMPRESSION&&this._onAdStarted(b);});this._onSlotEnded=a.Util.bind(this,function(b){var c=b.slot.getTimePositionClass();b=b.slot;a.debug("DisplayRefreshExtension._onSlotEnded()",b,c);if(null!=b&&c!==a.TIME_POSITION_CLASS_DISPLAY&&0!==b.getAdInstances().length)if(this._refreshType===this.REFRESH_TYPE_AD)this._resetSubContext(),
  this._refreshSlots(this._displaySlots);else if(this._refreshType===this.REFRESH_TYPE_TIME){this._resetSubContext();this._refreshSlots(this._displaySlots);var e=this;this._refreshTimer=setInterval(function(){a.debug("DisplayRefreshExtension._onTimeout()");e._resetSubContext();e._refreshSlots(e._displaySlots);},1E3*this._refreshInterval);}});this._onRequestComplete=a.Util.bind(this,function(b){a.debug("DisplayRefreshExtension._onRequestComplete()");if(b.success){switch(this._context.getParameter("refreshType")){case "ad":this._refreshType=
  this.REFRESH_TYPE_AD;break;case "time":this._refreshInterval=this._context.getParameter("refreshInterval");this._refreshType=0<this._refreshInterval?this.REFRESH_TYPE_TIME:this.REFRESH_TYPE_NONE;break;default:this._refreshType=this.REFRESH_TYPE_NONE;}switch(this._context.getParameter("replaceMissingCompanion")){case "blank":this._replaceType=this.REPLACE_TYPE_BLANK;break;case "ad":this._replaceType=this.REPLACE_TYPE_AD;break;default:this._replaceType=this.REPLACE_TYPE_NONE;}if(this._refreshType!==this.REFRESH_TYPE_NONE||
  this._replaceType!==this.REPLACE_TYPE_NONE){if(this._displaySlots=this._context.getSlotsByTimePositionClass(a.TIME_POSITION_CLASS_DISPLAY),this._companionSlots=this._displaySlots.filter(function(a){return a.getAcceptCompanion()}),this._keyValues=this._context._adRequest._keyValues,this._globalParameters=this._context._globalLevelParameterDictionary,this._overrideParameters=this._context._overrideLevelParameterDictionary,this._firstTemporalAd=!0,this._context.addEventListener(a.EVENT_AD,this._onRendererEvent),
  this._context.addEventListener(a.EVENT_SLOT_ENDED,this._onSlotEnded),this._refreshType===this.REFRESH_TYPE_TIME){var c=this;this._refreshTimer=setInterval(function(){a.debug("DisplayRefreshExtension._onTimeout()");c._resetSubContext();c._refreshSlots(c._displaySlots);},1E3*this._refreshInterval);}}else this._refreshTimer&&clearInterval(this._refreshTimer);}else a.debug("DisplayRefreshExtension: request complete failed");});this._context.addEventListener(a.EVENT_REQUEST_COMPLETE,this._onRequestComplete);},
  _resetSubContext:function(){a.debug("DisplayRefreshExtension._resetSubContext()");this._subContext=this._context._adManager.cloneContext(this._context);this._subContext._extensionManager._displayRefreshExtension.dispose();this._subContext._extensionManager._videoStateExtension.dispose();this._subContext.setCapability(a.CAPABILITY_SLOT_TEMPLATE,a.CAPABILITY_STATUS_OFF);this._subContext.setCapability(a.CAPABILITY_DISPLAY_REFRESH,a.CAPABILITY_STATUS_ON);this._playRefreshedSlots=a.Util.bind(this,function(b){a.debug("DisplayRefreshExtension._playRefreshedSlots()");
  if(b.success){b=this._subContext.getSlotsByTimePositionClass(a.TIME_POSITION_CLASS_DISPLAY);for(var c=0;c<b.length;c++)b[c].play();}else a.debug("DisplayRefreshExtension._playRefreshedSlots(): subContext refresh request error:",b);});this._subContext.addEventListener(a.EVENT_REQUEST_COMPLETE,this._playRefreshedSlots);for(var b=this._subContext._adRequest._keyValues,c=0;c<this._keyValues.length;c++)0>b.indexOf(this._keyValues[c])&&b.push(this._keyValues[c]);for(var d in this._globalParameters)this._globalParameters.hasOwnProperty(d)&&
  this._subContext.setParameter(d,this._globalParameters[d],a.PARAMETER_LEVEL_GLOBAL);for(d in this._overrideParameters)this._overrideParameters.hasOwnProperty(d)&&this._subContext.setParameter(d,this._overrideParameters[d],a.PARAMETER_LEVEL_OVERRIDE);},_onAdStarted:function(b){a.debug("DisplayRefreshExtension._onAdStarted()");var c=b.adInstance.getSlot();a.debug("DisplayRefreshExtension._onAdStarted(): slot: ",c," | timePositionClass:",c.getTimePositionClass());if(null!=c&&c.getTimePositionClass()!==
  a.TIME_POSITION_CLASS_DISPLAY&&(this._resetSubContext(),this._refreshTimer&&clearInterval(this._refreshTimer),this._replaceType!==this.REPLACE_TYPE_NONE)){b=b.adInstance;c=c.getAdInstances();for(var d=0;d<c.length;d++)b.getAdId()===c[d].getAdId()&&this._checkMissingCompanionForAd(b);}},_checkMissingCompanionForAd:function(b){a.debug("DisplayRefreshExtension._checkMissingCompanionForAd()",b);var c=this._companionSlots.slice();b=b.getCompanionAdInstances();var d;for(d=0;d<b.length;d++){var e=c.indexOf(b[d].getSlot());
  -1<e&&c.splice(e,1);}this._firstTemporalAd&&(this._firstTemporalAd=!1,c=c.filter(function(b){if(b.getInitialAdOption()!==a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_ONLY&&b.getInitialAdOption()!==a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_STAND_ALONE&&b.getInitialAdOption()!==a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_THEN_STAND_ALONE&&b.getInitialAdOption()!==a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_NO_STAND_ALONE&&b.getInitialAdOption()!==a.SLOT_OPTION_INITIAL_AD_FIRST_COMPANION_OR_NO_STAND_ALONE_IF_TEMPORAL)return a.debug("DisplayRefreshExtension._checkMissingCompanionForAd(): firstCompanionAsInitial false in slot ",
  b.getCustomId()),!0;for(var c=b.getAdInstances(),d=0;d<c.length;d++)if(!c[d].isPlaceholder())return a.debug("DisplayRefreshExtension._checkMissingCompanionForAd(): first companion found in slot ",b.getCustomId()),!1;a.debug("DisplayRefreshExtension._checkMissingCompanionForAd(): firstCompanionAsInitial true, no ad in slot ",b.getCustomId());return !0}));if(this._replaceType===this.REPLACE_TYPE_BLANK)for(d=0;d<c.length;d++)c[d].stop(),this._subContext._replacePageSlot(c[d].getCustomId(),"");else this._replaceType===
  this.REPLACE_TYPE_AD&&this._refreshSlots(c);},_refreshSlots:function(b){a.debug("DisplayRefreshExtension._refreshSlots()",b);if(null!=b&&0!==b.length){for(var c=0;c<b.length;c++)b[c].stop(),this._subContext._refreshSlots.push(b[c].getCustomId());this._subContext._isRefreshRequest=!0;this._subContext.submitRequest(this._REQUEST_TIME_OUT);}},dispose:function(){a.debug("DisplayRefreshExtension.dispose()");this._context&&(this._context.removeEventListener(a.EVENT_REQUEST_COMPLETE,this._onRequestComplete),
  this._context.removeEventListener(a.EVENT_SLOT_ENDED,this._onSlotEnded),this._context.removeEventListener(a.EVENT_AD,this._onRendererEvent),this._context=null);this._subContext&&(this._subContext.removeEventListener(a.EVENT_REQUEST_COMPLETE,this._playRefreshedSlots),this._subContext=null);this._displaySlots=[];this._companionSlots=[];this._keyValues=[];this._globalParameters=[];this._overrideParameters=[];this._refreshType=this.REFRESH_TYPE_NONE;this._replaceType=this.REPLACE_TYPE_NONE;this._refreshInterval=
  0;this._refreshTimer&&clearInterval(this._refreshTimer);this._refreshTimer=null;this._firstTemporalAd=!0;}};a.DisplayRefreshExtension.prototype.constructor=a.DisplayRefreshExtension;a.Ad=function(){this._id=null;this._creatives=[];this._noLoad=!1;this._soAdUnit=null;this._isRequiredToShow=!1;};a.Ad.prototype={isRequiredToShow:function(){return this._isRequiredToShow},parse:function(b){if(b){this._id=b.adId||null;this._noLoad=b.noLoad;this._soAdUnit=b.adUnit;b.hasOwnProperty("required")&&(this._isRequiredToShow=
  b.required);var c=0;for(b=b.creatives||[];c<b.length;c++){var d=b[c],e=new a.Creative;e.parse(d);this._creatives.push(e);}}},getSoAdUnit:function(){return this._soAdUnit},getId:function(){return this._id},getNoLoad:function(){return this._noLoad},getCreative:function(a){for(var b=0;b<this._creatives.length;b++)if(this._creatives[b].getId()===a)return this._creatives[b];return null},addCreativeRendition:function(){var b=new a.Creative;this._creatives.push(b);return b}};a.Ad.prototype.constructor=a.Ad;
  a.Creative=function(){this._duration=this._baseUnit=this._id=null;this._parameters={};this._creativeRenditions=[];};a.Creative.prototype={getId:function(){return this._id},getBaseUnit:function(){return this._baseUnit},getDuration:function(){return this._duration},getParameter:function(a){return this._parameters[a]},setParameter:function(a,c){null==c?delete this._parameters[a]:this._parameters[a]=c;},parse:function(b){if(b){this._id=b.creativeId||null;this._baseUnit=b.baseUnit||null;this._duration=1*
  b.duration;if(b.parameters)if(b.parameters.constructor===Array)for(var c=0,d=b.parameters||[];c<d.length;c++){var e=d[c];this._parameters[e.name]=e.value;}else "object"===typeof b.parameters&&(this._parameters=a.Util.copy(b.parameters));c=0;for(d=b.creativeRenditions||[];c<d.length;c++){e=d[c];b=new a.CreativeRendition;b.parse(e);b.setDuration(this._duration);b.setBaseUnit(this._baseUnit);for(var f in this._parameters)this._parameters.hasOwnProperty(f)&&b.setParameter(f,this._parameters[f]);this._creativeRenditions.push(b);}}},
  getAllCreativeRenditions:function(){return this._creativeRenditions},addCreativeRendition:function(a){this._creativeRenditions.push(a);},getEligibleCreativeRenditionsForAdInstance:function(a){var b=[],d=[],e;for(e=0;e<this._creativeRenditions.length;e++){var f=this._creativeRenditions[e];f.getId()===a._creativeRenditionId&&f.getReplicaId()===a._replicaId&&b.push(f);""===f.getReplicaId()&&d.push(f);}return 0===b.length?d:b},cloneForTranslation:function(){var b=new a.Creative;b.parse({creativeId:this._id,
  baseUnit:this._baseUnit,duration:this._duration,parameters:a.Util.copy(this._parameters)});return b}};a.Creative.prototype.constructor=a.Creative;a.CreativeRendition=function(){this._id=null;this._creativeApi="None";this._baseUnit=null;this._replicaId="";this._height=this._width=this._preference=this._wrapperUrl=this._wrapperType=this._contentType=null;this._parameters={};this._primaryCreativeRenditionAsset=null;this._otherCreativeRenditionAssets=[];this._universalAdId=this._duration=null;};a.CreativeRendition.prototype=
  {getId:function(){return this._id},getCreativeApi:function(){return this._creativeApi},setCreativeApi:function(a){this._creativeApi=a||"None";},getReplicaId:function(){return this._replicaId},getContentType:function(){return this._contentType?this._contentType:this._primaryCreativeRenditionAsset&&this._primaryCreativeRenditionAsset.getContentType()?this._primaryCreativeRenditionAsset.getContentType():null},setContentType:function(a){this._contentType=a;},getWrapperType:function(){return this._wrapperType},
  setWrapperType:function(a){this._wrapperType=a;},getWrapperUrl:function(){return this._wrapperUrl},setWrapperUrl:function(a){this._wrapperUrl=a;},getBaseUnit:function(){return this._baseUnit},setBaseUnit:function(a){this._baseUnit=a;},getPreference:function(){return this._preference},setPreference:function(a){this._preference=a;},getWidth:function(){return this._width},setWidth:function(a){this._width=a;},getHeight:function(){return this._height},setHeight:function(a){this._height=a;},getDuration:function(){return this._duration},
  setDuration:function(a){this._duration=a;},getParameter:function(a){return this._parameters[a]},setParameter:function(a,c){null==c?delete this._parameters[a]:this._parameters[a]=c;},getUniversalAdId:function(){return this._universalAdId},setUniversalAdId:function(a){this._universalAdId=a;},getPrimaryCreativeRenditionAsset:function(){return this._primaryCreativeRenditionAsset},getOtherCreativeRenditionAssets:function(){return this._otherCreativeRenditionAssets.slice()},addCreativeRenditionAsset:function(b,
  c){var d=new a.CreativeRenditionAsset;d.setName(b);c?this._primaryCreativeRenditionAsset=d:this._otherCreativeRenditionAssets.push(d);return d},parse:function(b){if(b){this._id=b.creativeRenditionId||null;this._creativeApi=b.creativeApi||"None";this._replicaId=b.hasOwnProperty("adReplicaId")?b.adReplicaId:"";this._contentType=b.contentType||null;this._wrapperType=b.wrapperType||null;this._wrapperUrl=b.wrapperUrl||null;this._preference=1*b.preference;this._width=1*b.width;this._height=1*b.height;for(var c,
  d=0,e=b.parameters||[];d<e.length;d++)c=e[d],this._parameters[c.name]=c.value;this._primaryCreativeRenditionAsset=new a.CreativeRenditionAsset;this._primaryCreativeRenditionAsset.parse(b.asset);d=0;for(e=b.otherAssets||[];d<e.length;d++)c=e[d],b=new a.CreativeRenditionAsset,b.parse(c),this._otherCreativeRenditionAssets.push(b);}}};a.CreativeRendition.prototype.constructor=a.CreativeRendition;a.CreativeRenditionAsset=function(){this._bytes=this._mimeType=this._contentType=this._content=this._proxiedUrl=
  this._url=this._name=this._id=null;};a.CreativeRenditionAsset.prototype={getName:function(){return this._name},setName:function(a){this._name=a;},getUrl:function(){return this._url},getProxiedUrl:function(){return this._proxiedUrl},setUrl:function(b){this._url=b;this._proxiedUrl=a.Util.transformCreativeUrlToProxy(this._url);},getContent:function(){return this._content},setContent:function(a){this._content=a;},getContentType:function(){return this._contentType},setContentType:function(a){this._contentType=
  a;},getMimeType:function(){return this._mimeType},setMimeType:function(a){this._mimeType=a;},getBytes:function(){return this._bytes},setBytes:function(a){this._bytes=a;},parse:function(b){b&&(this._id=b.id||null,this._name=b.name||null,this._url=b.url||null,this._proxiedUrl=a.Util.transformCreativeUrlToProxy(this._url),this._content=b.content||null,this._contentType=b.contentType||null,this._mimeType=b.mimeType||null,this._bytes=1*b.bytes);}};a.CreativeRenditionAsset.prototype.constructor=a.CreativeRenditionAsset;
  a.AdManager=function(b){var c=this,d=this;this._context=this.newContext();this._context.addEventListener(a.EVENT_REQUEST_COMPLETE,function(a){d.onRequestComplete(a);});this._networkId=this._serverURL="";this._location=null;if(b){var e=a.Util.validateJSON(b,{profile:function(a){return "string"===typeof a},server:function(a){return "string"===typeof a},siteSectionID:function(a){return "string"===typeof a},network:function(a){return "number"===typeof a},mode:function(a){return a&&("live"===a.toLowerCase()||
  "on-demand"===a.toLowerCase())},appOEM:function(){return !0},appName:function(){return !0},appPlatform:function(){return !0}},"adConfig");if(e)throw b="Unable to initialize AdManager instance. "+e.message,a.warn(b),Error(b);this.setNetwork(b.network);this.setServer(b.server);this._adConfig=b;}this._fwGDPRConsent=this._fwGDPR=null;this._fwTCFAPIExecuted=!1;this._fwUSPString=null;this._isListeningForTCData=this._fwUSPAPIExecuted=!1;this._tcfapiImpl=null;this._tcfapiCallback=function(b,d){d?c._onTCFSuccess(b):
  (c._fwTCFAPIExecuted=!0,c._isListeningForTCData=!1,a.warn("TCFAPI add listener failed."));};this._fetchGDPRData();this._fetchCCPAData();};a.AdManager.prototype={getVersion:function(){if(a.version){var b=a.version.match(/^js-(\d)\.(\d)\.(\d).(\d)/)||a.version.match(/^js-(\d)\.(\d)\.(\d)/)||a.version.match(/^js-(\d)\.(\d)/);if(null!=b&&0<b.length){for(var c=0,d=0;d<b.length-1;d++)c+=b[b.length-d-1]<<(d<<3);return c}if(0===a.version.indexOf("js-master"))return 4294967295}return 0},setNetwork:function(b){a.debug("AdManager.setNetwork("+
  Array.prototype.slice.call(arguments).join(",")+")");if(0<1*b){this._networkId=1*b;for(var c in a._instanceQueue)if(a._instanceQueue.hasOwnProperty(c)){var d=a._instanceQueue[c];d&&d._videoAsset._videoPlayPending&&d._videoAsset.play();}}else a.warn("AdManager.setNetwork","valid networkId required");},setServer:function(b){a.debug("AdManager.setServer("+Array.prototype.slice.call(arguments).join(",")+")");if(b&&"string"===typeof b){this._serverURL=b;for(var c in a._instanceQueue)if(a._instanceQueue.hasOwnProperty(c)){var d=
  a._instanceQueue[c];d&&d._videoAsset._videoPlayPending&&d._videoAsset.play();}}else a.warn("AdManager.setServer","server url required");},setLocation:function(b){a.debug("AdManager.setLocation("+Array.prototype.slice.call(arguments).join(",")+")");this._location=b;},newContext:function(b,c){a.debug("AdManager.newContext("+Array.prototype.slice.call(arguments).join(",")+")");return new a.Context(this,b,c)},newContextWithContext:function(b){a.debug("AdManager.newContextWithContext("+Array.prototype.slice.call(arguments).join(",")+
  ")");var c=this.cloneContext(b);c._temporalSlotBase=b._temporalSlotBase;b.getContentVideoElement()&&(c.setContentVideoElement(b.getContentVideoElement()),delete c._temporalSlotBase["_fw_contentVideo_"+b._instanceId]);c._videoDisplaySize=b._videoDisplaySize;c._overriddenAdRenderers=b._overriddenAdRenderers;c._currentContentPlayheadTime=b._currentContentPlayheadTime;c.startSubsession(b._adRequest._subsessionToken);c.setRequestMode(b._adRequest._requestMode);c._adRequest._compatibleDimensions=b._adRequest._compatibleDimensions;
  c._adRequest._keyValues=b._adRequest._keyValues;c._videoAsset._state=b._videoAsset._state;c._videoAsset._callbackTimer=b._videoAsset._callbackTimer;c._videoAsset._videoPlayPending=b._videoPlayPending;c._videoAsset._requestedVideoViewUrl=b._videoAsset._requestedVideoViewUrl;c._videoAsset._delay=b._videoAsset._delay;c._videoAsset._durationType=b._videoAsset._durationType;b._customPlayer&&(c._customPlayer=b._customPlayer);var d=b._extensionManager.extensions,e;for(e in d)d.hasOwnProperty(e)&&c.loadExtension(d[e]);
  return this._context=c},_setupConsentPostMessage:function(b){a.debug("AdManager.setupConsentPostMessage");var c=b+"Locator",d=b+"Call",e=b+"Return",f=a.Util.getFrameAncestor(c),h={};window[b]=function(a,b,e){if(f){var g=Math.random()+"",m={};a=(m[d]={command:a,parameter:b,callId:g},m);h[g]=e;f.postMessage(a,"*");}else e({msg:c+" not found"},!1);};window.addEventListener("message",function(a){a="string"===typeof a.data?JSON.parse(a.data):a.data;a[e]&&(a=a[e],"function"===typeof h[a.callId]&&(h[a.callId](a.returnValue,
  a.success),delete h[a.callId]));},!1);},_retrieveGDPRWithPostMessage:function(){a.debug("AdManager.retrieveGDPRWithPostMessage");this._setupConsentPostMessage("__tcfapi");this._tcfapiImpl=window.__tcfapi;this._getGdprConsentData();},_fetchGDPRData:function(){a.debug("AdManager.fetchGDPRData");try{this._tcfapiImpl=a.Util.getTopMostWindow().__tcfapi,this._getGdprConsentData();}catch(b){a.warn("__tcfapi function on top window is inaccessible due to the following error: "+b),this._retrieveGDPRWithPostMessage();}},
  _addEventListenerForTCData:function(){a.debug("AdManager._addEventListenerForTCData");this._isListeningForTCData=!0;try{this._tcfapiImpl("addEventListener",a.GDPR_TCFAPI_VERSION,this._tcfapiCallback.bind(this));}catch(b){this._fwTCFAPIExecuted=!0,a.warn("AdManager._addEventListenerForTCData failed with err: ",b,b.description);}},_removeEventListenerForTCData:function(){a.debug("AdManager._removeEventListenerForTCData");this._isListeningForTCData=!1;try{this._tcfapiImpl("removeEventListener",a.GDPR_TCFAPI_VERSION,
  function(b){b?a.log("removeEventListener succeeded"):a.warn("TCFAPI remove listener failed.");},this._tcfapiCallback.bind(this));}catch(b){a.warn("AdManager._removeEventListenerForTCData failed with err: ",b,b.description);}},_getTCStringFromTCData:function(b){var c=b.gdprApplies;null!==c?void 0==c?this._fwGDPR="":"boolean"==typeof c?this._fwGDPR=c?1:0:(this._fwGDPR=c.toString(),a.warn("VendorConsentData's gdprApplies value is malformed.")):a.warn("VendorConsentData's gdprApplies value is missing.");
  b=b.tcString;null!=b?"string"==typeof b?this._fwGDPRConsent=b:(this._fwGDPRConsent=b.toString(),a.warn("VendorConsentData's consentData value is malformed.")):a.warn("VendorConsentData's consentData value is missing.");},_onTCFSuccess:function(b){a.debug("AdManager._onTCFSuccess with event status ",b.eventStatus);this._getTCStringFromTCData(b);"tcloaded"==b.eventStatus||"useractioncomplete"==b.eventStatus?(this._fwTCFAPIExecuted=!0,this._isListeningForTCData&&this._removeEventListenerForTCData()):
  "cmpuishown"==b.eventStatus?this._isListeningForTCData||this._addEventListenerForTCData():(this._fwGDPRConsent=this._fwGDPR="",this._fwTCFAPIExecuted=!0,a.warn("VendorConsentData's event status is missing or not valid."));},_getGdprConsentData:function(){a.debug("AdManager.getGdprConsentData");if("function"==typeof this._tcfapiImpl)try{this._tcfapiImpl("getTCData",a.GDPR_TCFAPI_VERSION,this._tcfapiCallback.bind(this));}catch(b){this._fwTCFAPIExecuted=!0,a.warn("AdManager.getGdprConsentData failed with err: ",
  b,b.description);}else this._fwTCFAPIExecuted=!0,a.warn("TCFAPI function cannot be found. _fw_gdpr: "+this._fwGDPR+", _fw_gdpr_consent: "+this._fwGDPRConsent);},_retrieveCCPAWithPostMessage:function(){a.debug("AdManager.retrieveCCPAWithPostMessage");this._setupConsentPostMessage("__uspapi");this._getUSPData(window.__uspapi);},_fetchCCPAData:function(){a.debug("AdManager.fetchCCPAData");try{var b=a.Util.getTopMostWindow().__uspapi;this._getUSPData(b);}catch(c){a.warn("__uspapi function on top window is inaccessible due to the following error: "+
  c),this._retrieveCCPAWithPostMessage();}},_getUSPData:function(b){a.debug("AdManager.getUSPData");if("function"==typeof b)try{var c=this;b("getUSPData",1,function(b,e){e?(b=b.uspString,null!=b?"string"==typeof b?c._fwUSPString=b:(c._fwUSPString=b.toString(),a.warn("USPData's uspString value is malformed.")):a.warn("USPData's uspString value is missing.")):a.warn("Cannot retrieve CCPA params from USPAPI.");c._fwUSPAPIExecuted=!0;},this);}catch(d){this._fwUSPAPIExecuted=!0,a.warn("AdManager.getUSPData "+
  d.description);}else this._fwUSPAPIExecuted=!0,a.warn("USPAPI function cannot be found. _fw_us_privacy: "+this._fwUSPString);},dispose:function(){a.debug("AdManager.dispose()");this._context.dispose();},cloneContext:function(a){var b=this.newContext(),d=a._adRequest._capabilities._capabilities,e;for(e in d)d.hasOwnProperty(e)&&b.setCapability(e,d[e]);b.setProfile(a._adRequest._playerProfile);b.setSiteSection(a._ss_id,a._ss_networkId,a._ss_pageViewRandom,a._ss_idType,a._ss_fallbackId);b.setVideoAsset(a._va_id,
  a._va_duration,a._va_networkId,a._va_location,a._va_autoPlayType,a._va_viewRandom,a._va_idType,a._va_fallbackId,a._va_durationType);b.setVisitor(a._adRequest._visitorCustomId,a._adRequest._visitorIpV4Address);return b}};a.AdManager.prototype.constructor=a.AdManager;a._instanceCounter=0;a._instanceQueue={};a.Context=function(b,c,d){var e="",f="";if(c&&!b._adConfig)e=" A videoConfig object should only be used to initialize Context when AdManager was initialized with an adConfig object.";else if(!c&&
  b._adConfig)e=" A videoConfig object is required to initiaize Context when AdManager was initialized with an adConfig object.";else if(c){var h=a.Util.validateJSON(c,{duration:function(a){return "number"===typeof a},customID:function(a){return "string"===typeof a},language:function(){return !0},genre:function(){return !0},brand:function(){return !0},rating:function(){return !0}},"videoConfig");h&&(e=" "+h.message);d?"string"!==typeof d&&"object"!==typeof d?f=" The player argument is the incorrect type. It should either be a string or an object.":
  "object"===typeof d&&(h=a.Util.validateCustomPlayer(d))&&(f=" "+h.message):f=" No player argument was passed. The player argument is required when using a videoConfig object.";}if(0<e.length||0<f.length)throw c="Unable to initialize Context instance."+e+f,a.warn(c),Error(c);this._adManager=b;this._eventDispatcher=new a.EventDispatcher;this._adRequest=new a.AdRequest(this);this._adResponse=null;this._videoAsset=new a.VideoAsset(this);this._customPlayer=this._temporalSlotBase=null;this._videoDisplaySize=
  {};this._globalLevelParameterDictionary={};this._overrideLevelParameterDictionary={};this._globalLevelParameterDictionary[a.PARAMETER_AUTO_PAUSE_AD_ONVISIBILITYCHANGE]=!0;this._globalLevelParameterDictionary[a.PARAMETER_DISABLE_CORS_ENFORCEMENT]=!0;this._globalLevelParameterDictionary[a.PARAMETER_USE_GDPR_TCFAPI]=!0;this._globalLevelParameterDictionary[a.PARAMETER_USE_CCPA_USPAPI]=!0;this._globalLevelParameterDictionary[a.PARAMETER_CONSENT_RETRIEVAL_TIMEOUT]=500;this._globalLevelParameterDictionary[a.PARAMETER_ENABLE_ACCESS_CONTROL_ALLOW_CREDENTIALS]=
  !1;a.Util.setContext(this);this._rendererManifest={};this._overriddenAdRenderers=[];this._extensionManager=new a.ExtensionManager(this);this._totalSetDisplaySizeCount=this._autoSetDisplaySizeCount=this._requestState=0;this._instanceId=a._instanceCounter;a._instanceQueue["Context_"+a._instanceCounter]=this;a._instanceCounter++;this._contentVideoAttached=!1;this._currentContentPlayheadTime=0;this._ss_id="";this._ss_networkId=this._ss_pageViewRandom=0;this._ss_idType=a.ID_TYPE_CUSTOM;this._va_location=
  this._va_networkId=this._va_duration=this._va_id=this._ss_fallbackId="";this._va_autoPlayType=a.VIDEO_ASSET_AUTO_PLAY_TYPE_ATTENDED;this._va_fallbackId="";this._va_viewRandom=0;this._va_idType=a.ID_TYPE_CUSTOM;this._va_durationType=a.VIDEO_ASSET_DURATION_TYPE_EXACT;this._isRefreshRequest=!1;this._refreshSlots=[];this._adVolume=1;this._onVolumeChange=this.__onVolumeChange.bind(this);c&&(b=b._adConfig,this.setProfile(b.profile),this.setVideoAsset(c.customID,c.duration,b.network),this.setSiteSection(b.siteSectionID,
  b.network),this.setRequestMode(b.mode.toLowerCase()),"object"===typeof d?this._registerCustomPlayer(d):this.registerVideoDisplayBase(d),c.language&&this.addKeyValue("_fw_content_language",c.language),c.genre&&this.addKeyValue("_fw_content_genre",c.genre),c.brand&&this.addKeyValue("_fw_content_programmer_brand",c.brand),c.rating&&this.addKeyValue("_fw_content_rating",c.rating),b.appOEM&&this.addKeyValue("_fw_app_oem",b.appOEM),b.appName&&this.addKeyValue("_fw_app_name",b.appName),b.appPlatform&&this.addKeyValue("_fw_app_platform",
  b.appPlatform));};a.Context.prototype={getAdVolume:function(){return this._customPlayer?(a.warn("Context.getAdVolume: volume control is not supported when using custom player"),-1):this._adVolume},setAdVolume:function(b){if(this._customPlayer)a.warn("Context.setAdVolume: volume control is not supported when using custom player");else if(a.debug("Context.setAdVolume",b),this.getContentVideoElement())if("number"!==typeof b||0>b||1<b)a.debug("Invalid volume: "+b);else if((a.PLATFORM_IS_IPHONE_IPOD||a.PLATFORM_IS_IPAD)&&
  0<b&&1>b)a.debug("iOS doesn't allow volume values other than 0 and 1, ignore.");else if(b===this._adVolume)a.debug("Volume did not change, ignore.");else {this._adVolume=b;b=this.getTemporalSlots();for(var c=0;c<b.length;++c){var d=b[c];if(d.getType()===a.SLOT_TYPE_TEMPORAL&&d.getState()!==a.MediaInitState.instance&&d.getState()!==a.MediaEndState.instance&&(d=d.getCurrentAdInstance())){d.setVolume(this._adVolume);break}}}else a.debug("No video element set, ignore.");},__onVolumeChange:function(b){a.debug("Context._onVolumeChange(): event = "+
  b.type);a.debug("Context._onVolumeChange(): video element is muted: "+this.getContentVideoElement().muted);0!==this._adVolume||this.getContentVideoElement().muted?this.setAdVolume(this.getContentVideoElement().muted?0:this.getContentVideoElement().volume):this.setAdVolume(this.getContentVideoElement().volume);},addRenderer:function(a,c,d,e,f,h,g){this._overriddenAdRenderers.push({url:a,baseUnit:c,contentType:d,creativeApi:h,slotType:e,soAdUnit:f,parameter:g});},setCapability:function(b,c){a.debug("Context.setCapability",
  b,c);this._adRequest.setCapability(b,c);},addKeyValue:function(b,c){a.debug("Context.addKeyValue",b,c);this._adRequest.addKeyValue(b,c);},setParameter:function(b,c,d){a.debug("Context.setParameter",b,c,d);if(d===a.PARAMETER_LEVEL_GLOBAL)d=this._globalLevelParameterDictionary;else if(d===a.PARAMETER_LEVEL_OVERRIDE)d=this._overrideLevelParameterDictionary;else return;null==c?delete d[b]:d[b]=c;},getParameter:function(a){return a?this._overrideLevelParameterDictionary.hasOwnProperty(a)?this._overrideLevelParameterDictionary[a]:
  this._adResponse&&this._adResponse._profileParameters.hasOwnProperty(a)?this._adResponse._profileParameters[a]:this._globalLevelParameterDictionary.hasOwnProperty(a)?this._globalLevelParameterDictionary[a]:null:null},setVideoState:function(b){a.debug("Context.setVideoState",b);this._videoAsset.setVideoState(b);},registerVideoDisplayBase:function(b){a.debug("Context.registerVideoDisplayBase",b);if(b&&"string"===typeof b){if(this._temporalSlotBase&&this._temporalSlotBase.id===b){a.debug("Context.registerVideoDisplayBase",
  "register the same display base, will only change size");var c=this._temporalSlotBase.getElementsByTagName("video");}else {this._temporalSlotBase&&this.getContentVideoElement().removeEventListener("volumechange",this._onVolumeChange);this._temporalSlotBase=document.getElementById(b);if(!this._temporalSlotBase){a.warn("Context.registerVideoDisplayBase","could not get element",b);return}c=this._temporalSlotBase.getElementsByTagName("video");if(0===c.length){a.warn("Context.registerVideoDisplayBase","could not get video element from",
  b);this._temporalSlotBase=null;return}this._temporalSlotBase["_fw_contentVideo_"+this._instanceId]=c[0];this.getContentVideoElement().addEventListener("volumechange",this._onVolumeChange);this._adVolume=c[0].muted?0:c[0].volume;}this._setVideoDisplaySizeByContentVideo(c[0]);}else a.warn("Context.registerVideoDisplayBase","id required");},setContentVideoElement:function(b){a.debug("Context.setContentVideoElement()");if(b&&b.parentNode){var c=this._temporalSlotBase;this._temporalSlotBase=b.parentNode;
  this._temporalSlotBase["_fw_contentVideo_"+this._instanceId]===b?a.debug("Context.setContentVideoElement","set the same video in same div, will only change size"):(c&&c["_fw_contentVideo_"+this._instanceId]&&c["_fw_contentVideo_"+this._instanceId].removeEventListener("volumechange",this._onVolumeChange),this._temporalSlotBase["_fw_contentVideo_"+this._instanceId]=b,this.getContentVideoElement().addEventListener("volumechange",this._onVolumeChange),this._adVolume=this.getContentVideoElement().muted?
  0:this.getContentVideoElement().volume);this._setVideoDisplaySizeByContentVideo(b);}else a.warn("Context.setContentVideoElement","contentVideo and contentVideo.parentNode is required");},registerCustomPlayer:function(b){a.debug("Context.registerCustomPlayer");var c=a.Util.validateCustomPlayer(b);c?a.warn("Context.registerCustomPlayer: "+c.message):this._registerCustomPlayer(b);},_registerCustomPlayer:function(a){this._customPlayer=a;this._videoDisplaySize={left:0,top:0,width:0,height:0,position:0};},
  getContentVideoElement:function(){return this._temporalSlotBase?this._temporalSlotBase["_fw_contentVideo_"+this._instanceId]:(a.warn("Context.getContentVideoElement: SlotBase is null"),null)},getCustomPlayer:function(){return this._customPlayer?this._customPlayer:(a.warn("Context.getCustomPlayer: customPlayer was null"),null)},setVideoDisplaySize:function(b,c,d,e,f){a.debug("Context.setVideoDisplaySize("+Array.prototype.slice.call(arguments).join(",")+")");this._totalSetDisplaySizeCount++;this._videoDisplaySize=
  {left:b,top:c,width:d,height:e,position:f};for(var h=this.getTemporalSlots(),g=0;g<h.length;++g){var m=h[g];m.setWidth(d);m.setHeight(e);if(m.getState()===a.MediaPlayingState.instance||m.getState()===a.MediaReplayingState.instance){if(h=m.getCurrentAdInstance())(h=h.getRendererController().getRenderer())&&h.resize?h.resize():a.debug("renderer do not support resize");break}}},getVideoDisplaySize:function(){function a(a){a=parseInt(a,10);isNaN(a)&&(a=0);return a}this._videoDisplaySize.left=a(this._videoDisplaySize.left);
  this._videoDisplaySize.top=a(this._videoDisplaySize.top);this._videoDisplaySize.width=a(this._videoDisplaySize.width);this._videoDisplaySize.height=a(this._videoDisplaySize.height);return this._videoDisplaySize},setVideoDisplayCompatibleSizes:function(b){a.debug("Context.setVideoDisplayCompatibleSizes",b);this._adRequest.setVideoDisplayCompatibleSizes(b);},resize:function(b,c){a.debug("Context.resize("+Array.prototype.slice.call(arguments).join(",")+")");if(!this._temporalSlotBase)return a.warn("SlotBase is null"),
  null;this.setVideoDisplaySize(this._videoDisplaySize.left,this._videoDisplaySize.top,b,c,this._videoDisplaySize.position);},setProfile:function(b){a.debug("Context.setProfile",b);this._adRequest.setProfile(b);},setVideoAsset:function(b,c,d,e,f,h,g,m,l){a.debug("Context.setVideoAsset("+Array.prototype.slice.call(arguments).join(",")+")");this._videoAsset.setVideoAsset(b,c,d,e,f,h,g,m,l);this._va_id=b;this._va_duration=c;this._va_networkId=d;this._va_location=e;this._va_autoPlayType=f;this._va_viewRandom=
  h;this._va_idType=g;this._va_fallbackId=m;this._va_durationType=l;},setVideoAssetCurrentTimePosition:function(b){a.debug("Context.setVideoAssetCurrentTimePosition("+b+")");this._videoAsset.setVideoAssetCurrentTimePosition(b);},setSiteSection:function(b,c,d,e,f){a.debug("Context.setSiteSection("+Array.prototype.slice.call(arguments).join(",")+")");this._adRequest.setSiteSection(b,c,d,e,f);this._ss_id=b;this._ss_networkId=c;this._ss_pageViewRandom=d;this._ss_idType=e;this._ss_fallbackId=f;},setVisitor:function(b,
  c){a.debug("Context.setVisitor("+Array.prototype.slice.call(arguments).join(",")+")");this._adRequest.setVisitor(b,c);},startSubsession:function(b){a.debug("Context.startSubsession("+b+")");this._adRequest.setSubsessionToken(b);},setRequestMode:function(b){a.debug("Context.setRequestMode("+b+")");this._adRequest.setRequestMode(b);},setRequestDuration:function(b){a.debug("Context.setRequestDuration("+b+")");this._adRequest.setRequestDuration(b);},addCandidateAd:function(b){a.debug("Context.addCandidateAd("+
  b+")");this._adRequest.addCandidateAd(b);},addTemporalSlot:function(b,c,d,e,f,h,g,m,l){a.debug("Context.addTemporalSlot("+Array.prototype.slice.call(arguments).join(",")+")");this._adRequest.addTemporalSlot(b,c,d,e,f,h,g,m,l);},getTemporalSlots:function(){return this._adResponse?this._adResponse._temporalSlots.slice():[]},getSlotByCustomId:function(a){return this._adResponse?this._adResponse.getSlotByCustomId(a):null},getSlotsByTimePositionClass:function(a){var b=[],d;if(this._adResponse){for(d=0;d<
  this._adResponse._temporalSlots.length;d++)this._adResponse._temporalSlots[d].getTimePositionClass()===a&&b.push(this._adResponse._temporalSlots[d]);for(d=0;d<this._adResponse._siteSectionNonTemporalSlots.length;d++)this._adResponse._siteSectionNonTemporalSlots[d].getTimePositionClass()===a&&b.push(this._adResponse._siteSectionNonTemporalSlots[d]);for(d=0;d<this._adResponse._videoPlayerNonTemporalSlots.length;d++)this._adResponse._videoPlayerNonTemporalSlots[d].getTimePositionClass()===a&&b.push(this._adResponse._videoPlayerNonTemporalSlots[d]);}return b},
  _isConsentRequired:function(){var b=this.getParameter(a.PARAMETER_USE_GDPR_TCFAPI)&&!this._adManager._fwTCFAPIExecuted,c=this.getParameter(a.PARAMETER_USE_CCPA_USPAPI)&&!this._adManager._fwUSPAPIExecuted;return b||c},submitRequest:function(b){a.debug("Context.submitRequest",b);var c=0;if(!this._isConsentRequired()||this._isRefreshRequest)this._submitValidatedRequest(b);else var d=this.getParameter(a.PARAMETER_CONSENT_RETRIEVAL_TIMEOUT),e=setInterval(function(){c+=100;if(!this._isConsentRequired()||
  c>=d)clearInterval(e),this._submitValidatedRequest(b);}.bind(this),100);},_submitValidatedRequest:function(b){this.dispatchEvent(a.EVENT_REQUEST_INITIATED,{});this._adManager._isListeningForTCData&&this._adManager._removeEventListenerForTCData();if(this._requestState)a.warn("Context.submitRequest: request already submitted");else if(a.Util.isBlank(this._adManager._serverURL))a.warn("Context.submitRequest: serverURL is not set");else {this._requestState=1;this._adRequest.useTCFAPI();this._adRequest.useUSPAPI();
  this._adRequest.scanPageSlots();if(this._isRefreshRequest){var c={},d=[],e,f;for(e=0;e<this._refreshSlots.length;e++){var h=this._refreshSlots[e];if(void 0!==this._adRequest._slotScanner._slots[h]){c[h]=this._adRequest._slotScanner._slots[h];var g=c[h].split("&");for(f=0;f<g.length;f++)-1!==g[f].search("flag")&&(g[f]="flag=-cmpn");c[h]=g.join("&");}for(f=0;f<this._adRequest._slotScanner._knownSlots.length;f++)this._adRequest._slotScanner._knownSlots[f].id===h&&(g=this._adRequest._slotScanner._knownSlots[f],
  g.acceptCompanion=!1,g.initialAdOption=a.SLOT_OPTION_INITIAL_AD_STAND_ALONE,d.push(g));}this._adRequest._slotScanner._slots=c;this._adRequest._slotScanner._knownSlots=d;}this.getParameter(a.PARAMETER_ENABLE_FORM_TRANSPORT)?(a.debug("Context.submitRequest: enabling Safari transport mechanism globally"),a.PLATFORM_SEND_REQUEST_BY_FORM=!0,a.PLATFORM_SEND_REQUEST_BY_JS=!1,this.setParameter(a.PARAMETER_ENABLE_JS_TRANSPORT,!1,a.PARAMETER_LEVEL_GLOBAL)):this.getParameter(a.PARAMETER_ENABLE_JS_TRANSPORT)?(a.debug("Context.submitRequest: enabling JS transport mechanism globally"),
  a.PLATFORM_SEND_REQUEST_BY_JS=!0,a.PLATFORM_SEND_REQUEST_BY_FORM&&a.warn("PARAMETER_ENABLE_FORM_TRANSPORT was enabled while attempting to use PARAMETER_ENABLE_JS_TRANSPORT. This will prevent PARAMETER_ENABLE_JS_TRANSPORT from working properly. Please disable PARAMETER_ENABLE_FORM_TRANSPORT before attempting to use PARAMETER_ENABLE_JS_TRANSPORT."),this.setParameter(a.PARAMETER_ENABLE_FORM_TRANSPORT,!1,a.PARAMETER_LEVEL_GLOBAL)):a.PLATFORM_SEND_REQUEST_BY_JS=!1;c=this._adManager._serverURL;".js"!==
  c.substring(c.length-3,c.length)&&(c=this._adRequest.generateTypeBRequestUrl());d=function(){1===this._requestState&&(a.warn("Context.submitRequest: request timeout"),this.requestComplete(null));}.bind(this);b&&"number"===typeof b&&0<b&&(a.CONTEXT_REQUEST_TIMEOUT=b);setTimeout(d,1E3*a.CONTEXT_REQUEST_TIMEOUT);a.log("Context.submitRequest: sending request to",c,"timeout",a.CONTEXT_REQUEST_TIMEOUT);a.PLATFORM_SEND_REQUEST_BY_FORM?(a.debug("Context.submitRequest:","use json2"),a.Util.pingURLWithForm(c,
  this._instanceId,!0),this._onMessagePosted=function(a){"object"===typeof a.data&&a.data.hasOwnProperty("cbfn")&&-1<a.data.cbfn.indexOf("['Context_"+this._instanceId+"']")&&this.requestComplete(a.data.response);}.bind(this),window.addEventListener("message",this._onMessagePosted,!1)):a.PLATFORM_SEND_REQUEST_BY_JS?a.Util.sendAdRequestWithXMLHTTPRequest(c):a.Util.pingURLWithScript(c);}},requestComplete:function(b){if(1!==this._requestState)a.warn("ad request complete after timeout"),this.dispatchEvent(a.EVENT_REQUEST_COMPLETE,
  {success:!1});else {this._requestState=2;a.debug("Context.requestComplete");if(a.PLATFORM_SEND_REQUEST_BY_FORM){window.removeEventListener("message",this._onMessagePosted,!1);var c=document.getElementById("_fw_request_iframe_"+this._instanceId);document.body.removeChild(c);}if(null!=b){a._instanceQueue["Context_"+this._instanceId]=null;this._adResponse=new a.AdResponse(this);this._adResponse.parse(b,this._temporalSlotBase);a.log("Ad request succeeded");if(this._adResponse._profileParameters.autoloadExtensions){c=
  this._adResponse._profileParameters.autoloadExtensions.split(",");for(var d=0;d<c.length;d++){var e=c[d].trim();a.log("Loading extension: "+e);this.loadExtension(e);}}this.dispatchEvent(a.EVENT_REQUEST_COMPLETE,{success:!0,response:b});c=this._adResponse.getSiteSectionNonTemporalSlots();for(b=0;b<c.length;++b)a.log("Auto play site section nonTemporal slots"),c[b].play();c=this._adResponse.getVideoPlayerNonTemporalSlots();for(b=0;b<c.length;++b)a.log("Auto play video player nonTemporal slots"),c[b].play();}else a.warn("Ad request failed"),
  this.dispatchEvent(a.EVENT_REQUEST_COMPLETE,{success:!1});}},addEventListener:function(b,c){a.debug("Context.addEventListener",b);this._eventDispatcher.addEventListener(b,c);},removeEventListener:function(b,c){a.debug("Context.removeEventListener",b);this._eventDispatcher.removeEventListener(b,c);},dispatchEvent:function(b,c){a.log("Context.dispatchEvent type: "+b+", payload: "+c);if(b===a.EVENT_SLOT_STARTED){var d=c.slot.getTimePositionClass();if(d===a.TIME_POSITION_CLASS_PREROLL||d===a.TIME_POSITION_CLASS_MIDROLL||
  d===a.TIME_POSITION_CLASS_POSTROLL)this._contentVideoAttached=!0,this._markCurrentContentPlayheadTime();}else b===a.EVENT_SLOT_ENDED&&(d=c.slot.getTimePositionClass(),d===a.TIME_POSITION_CLASS_PREROLL||d===a.TIME_POSITION_CLASS_MIDROLL||d===a.TIME_POSITION_CLASS_POSTROLL)&&(this._contentVideoAttached=!1);c=c||{};c.type=b;c.target=this;this._eventDispatcher.dispatchEvent(c);},dispose:function(){a.debug("Context.dispose");this.setVideoState(a.VIDEO_STATE_STOPPED);if(this._adResponse){if(this._temporalSlotBase||
  this._customPlayer)for(var b=0,c=this._adResponse._temporalSlots||[];b<c.length;++b){var d=c[b];d.getCurrentAdInstance()&&d.stop();if(d._onContentVideoTimeUpdate&&this._temporalSlotBase){var e=this._temporalSlotBase["_fw_contentVideo_"+this._instanceId];e&&e.removeEventListener("timeupdate",d._onContentVideoTimeUpdate,!1);d._onContentVideoTimeUpdate=null;}}this._customPlayer&&(this._customPlayer=null);this._temporalSlotBase&&(this.getContentVideoElement().removeEventListener("volumechange",this._onVolumeChange),
  this._temporalSlotBase["_fw_contentVideo_"+this._instanceId]=null);this._isRefreshRequest=!1;this._refreshSlots=[];this._extensionManager.dispose();this._extensionManager=null;}},loadExtension:function(a){this._extensionManager.load(a,this);},_markCurrentContentPlayheadTime:function(){if(this._customPlayer)this._currentContentPlayheadTime=this._customPlayer.getPlayheadTime()||0;else if(this._temporalSlotBase){var a=this._temporalSlotBase["_fw_contentVideo_"+this._instanceId].currentTime;0<a&&(this._currentContentPlayheadTime=
  a);}},_getContentPlayheadTime:function(){var a=-1;this._customPlayer?a=this._currentContentPlayheadTime:!this._contentVideoAttached&&this._temporalSlotBase&&this._temporalSlotBase["_fw_contentVideo_"+this._instanceId]&&(a=this._temporalSlotBase["_fw_contentVideo_"+this._instanceId].currentTime);return 0<a?a:this._currentContentPlayheadTime},_requestContentVideoToPauseBySlot:function(a){this._videoAsset.requestPauseBySlot(a);},_requestContentVideoToResumeBySlot:function(a){this._videoAsset.requestResumeBySlot(a);},
  _setVideoDisplaySizeByContentVideo:function(a){if(this._autoSetDisplaySizeCount===this._totalSetDisplaySizeCount){var b=a.style.left,d=a.style.top,e=a.offsetWidth?a.offsetWidth:a.style.pixelWidth,f=a.offsetHeight?a.offsetHeight:a.style.pixelHeight;a=a.style.position;this._autoSetDisplaySizeCount++;this.setVideoDisplaySize(b,d,e,f,a);}},_replacePageSlot:function(b,c){a.debug("fw replace %s",b);var d;try{var e=document.getElementById(b)?document:parent.document.getElementById(b)?parent.document:null;
  var f=document.getElementById(b)?"window":parent.document.getElementById(b)?"parent":null;}catch(N){f=e=null;}if(!e)for(var h=0;h<window.frames.length;h++)try{window.frames[h].document.getElementById(b)&&(e=window.frames[h].document,f="window.frames["+h+"]");}catch(N){a.debug(N);}f&&(d=f+".document");a.debug("fw replacing slot %s in frame %s",b,d);if(!e)throw "Slot element not found: "+b;h=e.getElementById("_fw_container_"+b);h.innerHTML=c;c=h.getElementsByTagName("script");var g=e.getElementsByTagName("head")[0];
  for(h=0;h<c.length;++h)if(a.PLATFORM_IS_FIREFOX||c[h].src){var m=e.createElement("script");c[h].charset&&(m.charset=c[h].charset);c[h].src&&(m.src=c[h].src);c[h].innerHTML&&(m.innerHTML=c[h].innerHTML);m.onload=m.onreadystatechange=function(){this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||g.removeChild(m);};a.debug("fw append script for %s",b);g.appendChild(m);}else m=c[h].innerHTML,m=m.replace(/var fw_scope = document;/,"var fw_scope="+d+";"),m=m.replace(/var fw_scope_window = window;/,
  "var fw_scope_window="+f+";"),a.debug("fw eval in %s for %s, %s",d,b,m),eval(m);a.debug("fw finish replace %s",b);}};a.Context.prototype.constructor=a.Context;a.Capabilities=function(){this._capabilities={};this.init();};a.Capabilities.prototype={init:function(){for(var b=[a.CAPABILITY_SLOT_TEMPLATE,a.CAPABILITY_MULTIPLE_CREATIVE_RENDITIONS,a.CAPABILITY_FALLBACK_UNKNOWN_ASSET,a.CAPABILITY_FALLBACK_UNKNOWN_SITE_SECTION,a.CAPABILITY_FALLBACK_ADS,a.CAPABILITY_SLOT_CALLBACK,a.CAPABILITY_NULL_CREATIVE,a.CAPABILITY_AUTO_EVENT_TRACKING,
  a.CAPABILITY_RENDERER_MANIFEST],c=0;c<b.length;c++)this._capabilities[b[c]]=a.CAPABILITY_STATUS_ON;},setCapability:function(a,c){this._capabilities[a]=c;},getCapability:function(a){return this._capabilities[a]},parseCapabilities:function(b){var c="",d;for(d in this._capabilities)if(this._capabilities.hasOwnProperty(d)){switch(this._capabilities[d]){case a.CAPABILITY_STATUS_ON:c+="+"+d;break;case a.CAPABILITY_STATUS_OFF:c+="-"+d;}b=b.replace(new RegExp("(%2B|-|\\+)"+d,"g"),"");}c=encodeURIComponent(c);
  return b=-1<b.indexOf("flag=")?b.replace(/flag=/,"flag="+c):b+("&flag="+c)}};a.VideoAsset=function(b){this._defaultTimeouts=[5,10,15,30,60,120,180,300];this._context=b;this._internalState=a.MediaInitState.instance;this._eventCallback=this._state="";this._callbackTimer=null;this._requestedVideoViewUrl=this._videoPlayPending=!1;this._dummyInstanceId="";this._delay=0;this._location=this._networkId=this._duration=this._customId=this._id="";this._autoPlayType=null;this._fallbackId="";this._viewRandom=
  0;this._durationType=null;this._currentTpos=0;};a.VideoAsset.prototype={setVideoAsset:function(b,c,d,e,f,h,g,m,l){if(b){switch(g){case a.ID_TYPE_FW:g=this._id!==b;this._id=b;break;case a.ID_TYPE_GROUP:g=this._id!=="g"+b;this._id="g"+b;break;default:g=this._customId!==b,this._customId=b;}g&&(this._eventCallback="");"number"===typeof c&&(this._duration=Math.round(10*c)/10);0<1*d&&(this._networkId=1*d);"string"===typeof e&&(this._location=e);"number"===typeof f&&(this._autoPlayType=f);0<1*h&&(this._viewRandom=
  1*h);"number"===typeof m&&0<m?this._fallbackId=""+m:"string"===typeof m&&(this._fallbackId=m.trim());if(l===a.VIDEO_ASSET_DURATION_TYPE_EXACT||l===a.VIDEO_ASSET_DURATION_TYPE_VARIABLE)this._durationType=l;this._videoPlayPending&&this.play();}else a.warn("AdRequest.setVideoAsset","id is required.");},setVideoAssetCurrentTimePosition:function(b){!b||0>b?a.warn("AdRequest.setVideoAssetCurrentTimePosition","valid timePosition is required"):this._currentTpos=b;},setVideoState:function(b){b===a.VIDEO_STATE_PLAYING?
  (this._state===a.VIDEO_STATE_PAUSED&&this._context.dispatchEvent(a.EVENT_CONTENT_VIDEO_RESUMED),this.play()):b===a.VIDEO_STATE_PAUSED||b===a.VIDEO_STATE_STOPPED?(this.pause(),b===a.VIDEO_STATE_PAUSED&&this._state===a.VIDEO_STATE_PLAYING&&this._context.dispatchEvent(a.EVENT_CONTENT_VIDEO_PAUSED)):b===a.VIDEO_STATE_COMPLETED&&this.complete();this._state=b;},callback:function(b){this._eventCallback?this._eventCallback.process():b=!0;b||((b=this._defaultTimeouts.shift())||(b=300),this._callbackTimer=new a.Timer(b,
  a.Util.bind(this,this.callback)),this._callbackTimer.start());},getPlayheadTime:function(){var a=this._delay;this._delay=0;a+=this._callbackTimer?this._callbackTimer.getCTValue():0;return Math.floor(a)},play:function(){this._context._adManager._serverURL&&this._context._adManager._networkId&&(this._id||this._customId)?this._eventCallback?(this._videoPlayPending=!1,this._internalState.play(this)):this._requestedVideoViewUrl||(this._requestedVideoViewUrl=!0,this.requestForVideoViewCallback(),this._callbackTimer||
  (this._callbackTimer=new a.Timer,this._callbackTimer.tick())):(a.warn("Server URL or Network ID or Video Asset id/customId is not set, delay video asset state change until these are provided."),this._videoPlayPending=!0,this._callbackTimer||(this._callbackTimer=new a.Timer,this._callbackTimer.tick()));},pause:function(){this._internalState.pause(this);},complete:function(){this._internalState.complete(this);},onStartPlaying:function(){this.callback();},onStartReplaying:function(){this.callback();},onPausePlaying:function(){this.callback(!0);
  this._callbackTimer.pause();},onResumePlaying:function(){this._callbackTimer.start();},onCompletePlaying:function(){this.callback(!0);this._callbackTimer.stop();this._callbackTimer=null;this._eventCallback="";this._requestedVideoViewUrl=!1;},onCompleteReplaying:function(){this.onCompletePlaying();},setMediaState:function(a){this._internalState=a;},requestPauseBySlot:function(b){a.debug("requestPauseBySlot");this._internalState===a.MediaPlayingState.instance||this._internalState===a.MediaReplayingState.instance?
  this._context.dispatchEvent(a.EVENT_CONTENT_VIDEO_PAUSE_REQUEST,{slot:b}):a.debug("Not sending content pause request because content video state is",JSON.stringify(this._internalState));},requestResumeBySlot:function(b){a.debug("requestResumeBySlot");this._internalState===a.MediaPausedState.instance||this._internalState===a.MediaReplayPausedState.instance?this._context.dispatchEvent(a.EVENT_CONTENT_VIDEO_RESUME_REQUEST,{slot:b}):a.debug("Not sending content resume request because content video state is ",
  JSON.stringify(this._internalState));},requestForVideoViewCallback:function(){var b=new a.Context(this._context._adManager);b._videoAsset=this;this._dummyInstanceId=b._instanceId;b=this._context._adRequest.generateVideoViewRequestUrlWithDummyContextInstanceId(b._instanceId);var c=this;a.PLATFORM_SEND_REQUEST_BY_FORM?(a.debug("Context.submitRequest:","use json2"),a.Util.pingURLWithForm(b,this._dummyInstanceId,!0),c._onMessagePosted=function(a){"object"===typeof a.data&&a.data.hasOwnProperty("cbfn")&&
  -1<a.data.cbfn.indexOf("['Context_"+this._dummyInstanceId+"']")&&c.requestComplete(a.data.response);},window.addEventListener("message",c._onMessagePosted,!1)):a.PLATFORM_SEND_REQUEST_BY_JS?a.Util.pingURLWithXMLHTTPRequest(b):a.Util.pingURLWithScript(b);},requestComplete:function(b){this._delay=this._callbackTimer.tick();this._callbackTimer=null;if(a.PLATFORM_SEND_REQUEST_BY_FORM){window.removeEventListener("message",this._onMessagePosted,!1);var c=document.getElementById("_fw_request_iframe_"+this._dummyInstanceId);
  document.body.removeChild(c);}null!=b?(a._instanceQueue["Context_"+this._dummyInstanceId]=null,this.parse(a.Util.getObject("siteSection.videoPlayer.videoAsset",b)||{}),this.play()):a.warn("Failed to get video view callback url.");},parse:function(b){if(b){this._customId=b.customId;this._networkId=parseInt(b.networkId);for(var c=0,d=b.eventCallbacks||[];c<d.length;c++){b=d[c];var e=a.EventCallback.newEventCallback(this._context,b.name,b.type);if(e&&b.name===a.EVENT_VIDEO_VIEW){e.parse(b);this._eventCallback=
  e;a.debug("Parsed video view url: "+this._eventCallback._url);break}}}}};a.NullRenderer=function(){this._rendererController=null;};a.NullRenderer.prototype={start:function(b){this._rendererController=b;this._rendererController.setCapability(a.EVENT_AD_CLICK,a.CAPABILITY_STATUS_OFF);this._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED);this._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED);},info:function(){return {moduleType:a.MODULE_TYPE_RENDERER}},getPlayheadTime:function(){return -1},
  getDuration:function(){return -1}};a.NullRenderer.prototype.constructor=a.NullRenderer;a.VPAIDWrapper=function(){this._creative=null;this._timeoutInMs=0;this._eventHandlers={};this._timeoutTimer=null;this._timeoutOperation="";this.timeoutReached=!1;this._visibilityChangeListener=null;this._creativePausedByTabSwitch=!1;this._autoPauseAdOnVisibilityChange=!0;this._loadIntervalTimer=null;this._isCORSEnforcementDisabled=!0;};a.VPAIDWrapper.prototype={_isCreativeFunctionInvokable:function(a){return this._creative?
  (a=this._creative[a])&&"function"===typeof a:!1},checkVPAIDInterface:function(a){for(var b={passed:!0,missingInterfaces:""},d=a.length-1;0<=d;d--)this._isCreativeFunctionInvokable(a[d])||(b.passed=!1,b.missingInterfaces+=a[d]+" ");return b},loadCreativeAsset:function(b){a.log("loadCreativeAsset("+b+")");var c=document.getElementById("vpaidFrame"),d=document.createElement("iframe");d.id="vpaidFrame";null==c?document.body.appendChild(d):document.body.replaceChild(d,c);d.width=0;d.height=0;d.style.display=
  "none";d.contentWindow.document.open();if(this._isCORSEnforcementDisabled){a.log("CORS Enforcement Disabled");d.contentWindow.document.write('<script type="text/javascript" src="'+b+'"> \x3c/script>');d.contentWindow.document.close();this._timeoutOperation="loadCreativeAsset";this._waitForTimeout();var e=this;this._loadIntervalTimer=setInterval(function(){var b=document.getElementById("vpaidFrame").contentWindow.getVPAIDAd;b&&"function"===typeof b&&(clearInterval(e._loadIntervalTimer),b=b(),"undefined"===
  typeof b?a.debug("getVPAIDAd() returns undefined value"):null==b?a.debug("getVPAIDAd() returns null"):(e._creative=b,e._eventHandlers.CreativeAssetLoaded()));},200);}else {d.contentWindow.document.close();this._timeoutOperation="loadCreativeAsset";e=this;var f=new XMLHttpRequest;f.open("GET",b);f.timeout=e._timeoutInMs;f.onreadystatechange=function(){if(4==f.readyState)if(200===f.status)try{d.contentWindow.eval(f.responseText);var c=d.contentWindow.getVPAIDAd;if(c&&"function"===typeof c){var g=c();if("undefined"===
  typeof g)throw "getVPAIDAd() returns undefined value";if(null==g)throw "getVPAIDAd() returns null";e._creative=g;e._eventHandlers.CreativeAssetLoaded();}else throw "getVPAIDAd() funtion does not exist";}catch(m){a.warn(m),e._eventHandlers.loaderror(a.ERROR_3P_COMPONENT,"Creative is not VPAID: "+m);}else 400<=f.status&&e._eventHandlers.loaderror(a.ERROR_IO,"creativeUrl="+b+"; status code="+f.status+"; status text="+f.statusText);};f.ontimeout=function(){e._eventHandlers.timeout.call();};f.onerror=function(){0===
  f.status?(a.warn("CORS error"),e._eventHandlers.loaderror(a.ERROR_SECURITY,"creativeUrl="+b+";cors error")):(a.warn("exception:"+f.statusText),e._eventHandlers.loaderror(a.ERROR_IO,"creativeUrl="+b+";exception="+f.statusText));};f.send();}},setCallbacksForCreative:function(a,c){for(var b in a)a.hasOwnProperty(b)&&this._creative.subscribe(a[b],b,c);},removeCallbacksForCreative:function(a){for(var b in a)a.hasOwnProperty(b)&&this._creative.unsubscribe(a[b],b);},handshakeVersion:function(b){a.log("VPAID Creative: handshakeVersion("+
  b+")");return this._creative.handshakeVersion(b)},initAd:function(b,c,d,e,f,h){a.log("VPAID Creative: initAd()");this._timeoutOperation="initAd";this._waitForTimeout();this._creative.initAd(b,c,d,e,f,h);},startAd:function(){a.log("VPAID Creative: startAd()");this._timeoutOperation="startAd";this._waitForTimeout();this._creative.startAd();document.hidden&&this._autoPauseAdOnVisibilityChange&&(a.log("VPAIDRenderer pause ad when tab is invisible"),this._creative.pauseAd(),this._creativePausedByTabSwitch=
  !0);},stopAd:function(){a.log("VPAID Creative: stopAd()");"loadCreativeAsset"===this._timeoutOperation?(clearInterval(this._loadIntervalTimer),this._timeoutOperation="loadCreativeAsset and stopAd"):"startAd"===this._timeoutOperation?(clearTimeout(this._timeoutTimer),this._timeoutOperation="startAd and stopAd"):this._timeoutOperation+="stopAd";this._creative&&(this._waitForTimeout(),this._creative.stopAd());},canPauseAd:function(){return this._isCreativeFunctionInvokable("pauseAd")},canResumeAd:function(){return this._isCreativeFunctionInvokable("resumeAd")},
  canResizeAd:function(){return this._isCreativeFunctionInvokable("resizeAd")},pauseAd:function(){this.canPauseAd()&&(a.log("VPAID Creative: pauseAd()"),this._creative.pauseAd());},resumeAd:function(){this.canResumeAd()&&(a.log("VPAID Creative: resumeAd()"),this._creative.resumeAd());},resizeAd:function(b,c,d){this.canResizeAd()?(a.log("VPAID Creative: resizeAd()"),this._creative.resizeAd(b,c,d)):a.log("The creative is not able to resize");},getAdVolume:function(){return this._isCreativeFunctionInvokable("getAdVolume")?
  this._creative.getAdVolume():-1},setAdVolume:function(a){this._isCreativeFunctionInvokable("setAdVolume")&&this._creative.setAdVolume(a);},getAdExpanded:function(){return this._isCreativeFunctionInvokable("getAdExpanded")?this._creative.getAdExpanded():!1},getAdRemainingTime:function(){return this._isCreativeFunctionInvokable("getAdRemainingTime")?this._creative.getAdRemainingTime():-1},getAdDuration:function(){return this._isCreativeFunctionInvokable("getAdDuration")?this._creative.getAdDuration():
  -1},getAdLinear:function(){return this._creative.getAdLinear()},getAdCompanions:function(){return this._isCreativeFunctionInvokable("getAdCompanions")?this._creative.getAdCompanions():""},setTimeoutValueInMs:function(a){this._timeoutInMs=a;},cancelTimeoutEvent:function(){a.log("cancelTimeoutEvent");var b="startAd and stopAd"!==this._timeoutOperation;clearTimeout(this._timeoutTimer);if(!b){this._timeoutOperation="startAd";var c=this;setTimeout(function(){c._eventHandlers&&c._eventHandlers.timeout&&
  c._eventHandlers.timeout.call();},500);}},addEventListener:function(a,c){this._eventHandlers[a]=c;},removeEventListener:function(a){this._eventHandlers[a]=null;},_waitForTimeout:function(){a.log("Wait for "+this._timeoutOperation+" for "+this._timeoutInMs+"ms");if(this._eventHandlers.timeout){var b=this;this._timeoutTimer=setTimeout(function(){b.timeoutReached||(b.timeoutReached=!0);"startAd"===b._timeoutOperation?b.stopAd():("loadCreativeAsset"===b._timeoutOperation&&clearInterval(b._loadIntervalTimer),
  b._eventHandlers&&b._eventHandlers.timeout&&b._eventHandlers.timeout.call());},this._timeoutInMs);}},getTimeoutOperation:function(){return this._timeoutOperation}};a.VPAIDWrapper.prototype.constructor=a.VPAIDWrapper;a.VPAIDRenderer=function(){this._rendererController=null;this._isCORSEnforcementDisabled=!0;this.vpaidCreative=null;this.vpaidVolume=this.vpaidDuration=-1;this.creativeEventCallbacks={};this.isMuted=!1;this.adPlaybackState="";this.creativeTimeoutDelayInMs=1E4;this.vpaidDesiredBitrate=268;
  this.vpaidViewmode="normal";this.playheadTime=0;this.videoBase=document.createElement("div");this.videoParent=null;this.SUPPORTED_CREATIVE_VPAID_VERSION_MIN=this.PLAYER_VPAID_VERSION=2;};a.VPAIDRenderer.prototype={};a.VPAIDRenderer.prototype.constructor=a.VPAIDRenderer;a.VPAIDRenderer.VastCompanion=function(a,c,d,e){this._width=a;this._height=c;this._apiFramework=d;this._xmlNode=e;};a.VPAIDRenderer.VastCompanion.prototype={getWidth:function(){return this._width},getHeight:function(){return this._height},
  _isValidResource:function(a,c){return "StaticResource"===a&&c["@attributes"].creativeType||"IFrameResource"===a&&c.value||"HTMLResource"===a&&c.value},hasValidRendtions:function(){for(var a in this._xmlNode)if(this._xmlNode.hasOwnProperty(a)&&("StaticResource"===a||"IFrameResource"===a||"HTMLResource"===a))for(var c=[].concat(this._xmlNode[a]),d=c.length-1;0<=d;d--)if(this._isValidResource(a,c[d]))return !0;return !1},translateToAdInstance:function(b){this._xmlNode.CompanionClickThrough&&b.setClickThroughUrl(a.EVENT_AD_CLICK,
  this._xmlNode.CompanionClickThrough.value);var c;if(this._xmlNode.TrackingEvents){var d=this._xmlNode.TrackingEvents;if(d.Tracking){d=[].concat(d.Tracking);var e=[];for(c=d.length-1;0<=c;c--)"creativeView"===d[c]["@attributes"].event&&e.push(d[c].value);0<e.length&&b.addEventCallbackUrls(a.EVENT_AD_IMPRESSION,a.EVENT_TYPE_IMPRESSION,e);}}for(var f in this._xmlNode)if(this._xmlNode.hasOwnProperty(f)&&("StaticResource"===f||"IFrameResource"===f||"HTMLResource"===f))for(d=[].concat(this._xmlNode[f]),
  c=d.length-1;0<=c;c--)if(this._isValidResource(f,d[c])){e=d[c];var h=b.addCreativeRendition();h.setWidth(this._width);h.setHeight(this._height);h.setCreativeApi("None");var g=h.addCreativeRenditionAsset("VPAIDAsset"+c,!0);g.setContentType("text/html_doc_lit_mobile");g.setMimeType("text/html");var m=b.getEventCallbackUrls(a.EVENT_AD_CLICK,a.EVENT_TYPE_CLICK)[0],l=f;if("HTMLResource"===l)g.setContent(a.HTMLAdGenerator.wrapUnsafeHTML(e.value,b.getSlot().getCustomId(),this._width,this._height));else {var n;
  "IFrameResource"===l?n="iframe":"StaticResource"===l&&(n=this._xmlNode.creativeType);g.setContent(a.HTMLAdGenerator.generateAd(e.value,m,b.getSlot().getCustomId(),this._width,this._height,n,g.getContentType()));}a.debug("rendtion width: "+h.getWidth()+" height:"+h.getHeight()+" asset content:"+g.getContent());}}};a.VPAIDRenderer.VastCompanion.prototype.constructor=a.VPAIDRenderer.VastCompanion;a.VPAIDRenderer.VastAdSelect=function(){};a.VPAIDRenderer.VastAdSelect.prototype={_getDeadSpaceRatio:function(b,
  c){var d=b.getWidth();b=b.getHeight();var e=c.getWidth();c=c.getHeight();var f=1;d<=e&&b<=c&&(f=1-d*b/(e*c));a.debug("computing dead space ratio ("+f+") for slot "+e+"x"+c+" and ad "+d+"x"+b);return f},matchAdsWithSlots:function(b,c){a.log("VPAIDRenderer: Matching ads with slots");var d;for(d=0;d<c.length;++d)c[d].matched=!1;var e=[],f=[];for(d=0;d<b.length;d++)for(var h=0;h<c.length;h++)f.push({ratio:this._getDeadSpaceRatio(b[d],c[h]),adIndex:d,slotIndex:h});f.sort(function(a,b){return a.ratio-b.ratio});
  for(d=0;d<f.length&&1!==f[d].ratio;d++){h=f[d];var g=b[h.adIndex],m=c[h.slotIndex];g.matched||m.matched||(a.log("Winning ratio:"+h.ratio+" Winning ad:"+g.getWidth()+"x"+g.getHeight()+" for slot:"+m.getWidth()+"x"+m.getHeight()),e.push({ad:g,slot:m}),g.matched=!0,m.matched=!0);}return e}};a.VPAIDRenderer.VastAdSelect.prototype.constructor=a.VPAIDRenderer.VastAdSelect;a.Util.mixin(a.VPAIDRenderer.prototype,{_initParams:function(){var b=this._rendererController.getParameter(a.PARAMETER_VPAID_CREATIVE_TIMEOUT_DELAY);
  this._isCORSEnforcementDisabled=this._rendererController.getParameter(a.PARAMETER_DISABLE_CORS_ENFORCEMENT);b&&0<Number(b)&&(this.creativeTimeoutDelayInMs=Number(b));a.log("initParams(), creative timeout delay in miliseconds:"+this.creativeTimeoutDelayInMs);b=parseFloat(this._rendererController.getParameter(a.PARAMETER_DESIRED_BITRATE));this.vpaidDesiredBitrate=0<b?b:this.vpaidDesiredBitrate;a.log("initParams(), desired bitrate: "+this.vpaidDesiredBitrate);},_failWithError:function(b,c,d){var e={};
  e[a.INFO_KEY_ERROR_MODULE]="VPAIDRenderer";e[a.INFO_KEY_ERROR_CODE]=b;d||(d=a.ERROR_VAST_GENERAL_VPAID_ERROR);e[a.INFO_KEY_VAST_ERROR_CODE]=d;c&&(e[a.INFO_KEY_ERROR_INFO]=c);this._rendererController.handleStateTransition(a.RENDERER_STATE_FAILED,e);this.dispose();},onCreativeLoadError:function(b,c){a.log("VPAIDRenderer: onCreativeLoadError()");this.vpaidCreative.cancelTimeoutEvent();this._failWithError(b,c);},onCreativeTimeout:function(){a.log("VPAIDRenderer: onCreativeTimeout()");var b=this.vpaidCreative.getTimeoutOperation();
  this._failWithError(a.ERROR_TIMEOUT,"loadCreativeAsset"!==b?"Creative function "+b+" timeout":"load creative asset timeout");},setVolume:function(b){a.log("VPAIDRenderer: setVolume("+b+")");this.vpaidCreative&&this.vpaidCreative.setAdVolume(b);},onAdVolumeChange:function(){a.log("VPAIDRenderer: onAdVolumeChange()");var b=this.vpaidCreative.getAdVolume();0>b||1<b?a.log("Invalid ad volume value"):(this.isMuted&&2<100*b?(this.isMuted=!1,this._rendererController.processEvent({name:a.EVENT_AD_UNMUTE})):
  !this.isMuted&&2>100*b&&(this.isMuted=!0,this._rendererController.processEvent({name:a.EVENT_AD_MUTE})),this._rendererController.processEvent({name:a.EVENT_AD_VOLUME_CHANGE}));},onAdExpandedChange:function(){a.log("VPAIDRenderer: onAdExpandedChange()");this.vpaidCreative.getAdExpanded()?this._rendererController.processEvent({name:a.EVENT_AD_EXPAND}):this._rendererController.processEvent({name:a.EVENT_AD_COLLAPSE});},onAdDurationChange:function(){a.log("VPAIDRenderer: onAdDurationChange(): duration changed to "+
  this.vpaidCreative.getAdDuration());},onAdClickThru:function(b,c,d){a.log("VPAIDRenderer: onAdClickThru() with url:"+b+" id:"+c+" playerHandles:"+d);c={name:a.EVENT_AD_CLICK,info:{}};c.info[a.INFO_KEY_SHOW_BROWSER]=!0===d;!0===d?b?(a.log("onAdClickThru(): open window with overrided url"),c.info[a.INFO_KEY_URL]=b):a.log("onAdClickThru(): open window with url booked in MRM UI or VAST clickthru url"):a.log("onAdClickThru(): send click tracking");this._rendererController.processEvent(c);},onCreativeAssetLoaded:function(){a.log("VPAIDRenderer: onCreativeAssetLoaded()");
  this.vpaidCreative.cancelTimeoutEvent();var b=this,c=function(){var c=b.vpaidCreative.handshakeVersion(b.PLAYER_VPAID_VERSION.toFixed(1));return c?parseFloat(c)<b.SUPPORTED_CREATIVE_VPAID_VERSION_MIN?(b._failWithError(a.ERROR_INVALID_VALUE,"Only support creatives with VPAID version >= "+b.SUPPORTED_CREATIVE_VPAID_VERSION_MIN.toFixed(1)),!1):!0:(b._failWithError(a.ERROR_3P_COMPONENT,"Cannot get VPAID version from the creative"),!1)};if(function(){var c=b.vpaidCreative.checkVPAIDInterface("handshakeVersion initAd startAd stopAd subscribe unsubscribe getAdLinear".split(" "));
  c.passed||b._failWithError(a.ERROR_3P_COMPONENT,"Missing interfaces in the VPAID creative: "+c.missingInterfaces);return c.passed}()&&c()){b.creativeEventCallbacks={AdStarted:b.onAdStarted,AdStopped:b.onAdStopped,AdSkipped:b.onAdSkipped,AdLoaded:b.onAdLoaded,AdLinearChange:b.onAdLinearChange,AdSizeChange:b.onAdSizeChange,AdExpandedChange:b.onAdExpandedChange,AdDurationChange:b.onAdDurationChange,AdVolumeChange:b.onAdVolumeChange,AdImpression:b.onAdImpression,AdClickThru:b.onAdClickThru,AdVideoFirstQuartile:b.onAdVideoFirstQuartile,
  AdVideoMidpoint:b.onAdVideoMidpoint,AdVideoThirdQuartile:b.onAdVideoThirdQuartile,AdVideoComplete:b.onAdVideoComplete,AdUserAcceptInvitation:b.onAdUserAcceptInvitation,AdUserMinimize:b.onAdUserMinimize,AdUserClose:b.onAdUserClose,AdPaused:b.onAdPaused,AdPlaying:b.onAdResumed,AdError:b.onAdError,AdLog:b.onAdLog};b.vpaidCreative.setCallbacksForCreative(b.creativeEventCallbacks,b);this._rendererController.setCapability(a.EVENT_AD_QUARTILE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_MUTE,
  a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_EXPAND,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_PAUSE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_CLOSE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_MINIMIZE,a.CAPABILITY_STATUS_ON);this._rendererController.setCapability(a.EVENT_AD_ACCEPT_INVITATION,a.CAPABILITY_STATUS_ON);(c=this.rendition?this.rendition.getParameter("creativeData"):
  null)||(c=this.rendition?this.rendition.getParameter("VPAID_creativeData"):null);c&&(c=a.Util.trim(c));c={AdParameters:c};var d=this._rendererController.getAdInstance().getSlot();this.videoBase.style.width="0px";this.videoBase.style.height="0px";this.videoBase.style.zIndex="100000";this.videoBase.style.position="absolute";this.videoBase.style.left=this._rendererController.getContentVideoElement().style.left;this.videoBase.style.top=this._rendererController.getContentVideoElement().style.top;this.videoBase.className=
  "fw_vpaid_slot";this.videoParent=d.getBase();var e=this._rendererController.getContentVideoElement();if("nodeType"in e&&0<e.nodeType)try{this.videoParent.insertBefore(this.videoBase,this._rendererController.getContentVideoElement());}catch(h){this.videoParent.insertBefore(this.videoBase,this.videoParent.firstChild);}else this.videoParent.insertBefore(this.videoBase,this.videoParent.firstChild);e={slot:this.videoBase,videoSlot:this._rendererController.getContentVideoElement(),videoSlotCanAutoPlay:!0};
  var f=d.getWidth();d=d.getHeight();f&&d||!this.rendition||(f=this.rendition.getWidth(),d=this.rendition.getHeight());this.vpaidCreative.initAd(f,d,this.vpaidViewmode,this.vpaidDesiredBitrate,c,e);}},onAdLoaded:function(){a.log("VPAIDRenderer: onAdLoaded()");this.vpaidCreative.cancelTimeoutEvent();a.log("Ad duration:"+this.getDuration());var b=this,c=function(c,d){var e=d;a.debug(e.length+" companion slots to fill.");if(0!==e.length&&0!==c.length){var f=(new a.VPAIDRenderer.VastAdSelect).matchAdsWithSlots(c,
  e);if(0!==f.length){c=[];e=[];for(d=f.length-1;0<=d;d--)c.push(f[d].ad),e.push(f[d].slot);e=b._rendererController.scheduleAdInstances(e);for(d=e.length-1;0<=d;d--)c[d].translateToAdInstance(e[d]);}}},d=function(b){if(!b)return a.log("The adCompanions property is empty."),null;a.log("parsing adCompanions: "+b);if(window.DOMParser)var c=(new DOMParser).parseFromString(b,"text/xml");else c=new ActiveXObject("Microsoft.XMLDOM"),c.async=!1,c.loadXML(b);b=a.Util.xmlToJson(c);if(!b||!b.CompanionAds||!b.CompanionAds.Companion)return a.log("No companion ads found in parsed xml"),
  [];b=[].concat(b.CompanionAds.Companion);c=[];for(var d=b.length-1;0<=d;d--){var e=b[d];if(e["@attributes"]){var m=e["@attributes"].width,l=e["@attributes"].height;if(!m||!l||0>m||0>l)a.log("Missing width/height for companion.");else {var n=e["@attributes"].apiFramework||"";a.debug("Companion "+m+"x"+l+" api:"+n);e=new a.VPAIDRenderer.VastCompanion(m,l,n,e);e.hasValidRendtions()&&c.push(e);}}}return c}(b.vpaidCreative.getAdCompanions());d&&0<d.length?c(d,this._rendererController.getCompanionSlots()):
  a.log("VPAIDAdRenderer: No companions from VPAID creative.");c=this._rendererController.getAdInstance()._context.getAdVolume();!this.isMuted&&2>100*c&&(this.isMuted=!0);this.setVolume(c);this.vpaidCreative.startAd();},onVisibilityChange:function(){a.log("onVisibilityChange:"+(document.hidden?"invisible":"visible"));a.log("Current playback state:"+this.adPlaybackState);document.hidden&&"playing"===this.adPlaybackState?(a.log("Pause the VPAID creative"),this.vpaidCreative.pauseAd(),this.vpaidCreative._creativePausedByTabSwitch=
  !0):!document.hidden&&"paused"===this.adPlaybackState&&this.vpaidCreative._creativePausedByTabSwitch&&(a.log("Resume the VPAID creative"),this.vpaidCreative.resumeAd(),this.vpaidCreative._creativePausedByTabSwitch=!1);},onAdStarted:function(){a.log("VPAIDRenderer: onAdStarted()");this.vpaidCreative.timeoutReached?a.log("VPAID ad has already failed due to timeout. The AdStarted event will not be handled."):(this.vpaidCreative.cancelTimeoutEvent(),this.vpaidCreative._autoPauseAdOnVisibilityChange&&(this._visibilityChangeListener=
  this.onVisibilityChange.bind(this),document.addEventListener("visibilitychange",this._visibilityChangeListener,!1)));},onAdStopped:function(){a.log("VPAIDRenderer: onAdStopped()");this.vpaidCreative?(this.vpaidCreative.cancelTimeoutEvent(),this.timePositionClass===a.TIME_POSITION_CLASS_OVERLAY&&this.vpaidCreative.getAdLinear()&&this._rendererController.requestContentStateChange(!1),this.vpaidCreative&&!this.vpaidCreative.timeoutReached&&(this.adPlaybackState?(this._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED),
  this.dispose()):(a.warn("Expecting AdStarted and AdImpression events but got AdStopped event instead. Fail."),this._failWithError(a.ERROR_3P_COMPONENT,"Expecting AdStarted and AdImpression events from the VPAID creative but got AdStopped event instead")))):a.log("The VPAID creative has been disposed. Return.");},onAdImpression:function(){a.log("VPAIDRenderer: onAdImpression()");if(this.vpaidCreative.timeoutReached)a.log("VPAID ad has already failed due to timeout. The AdImpression event will not be handled.");
  else {var b=this.vpaidCreative.getAdVolume();this.isMuted=0<b&&2>=100*b;this.adPlaybackState="playing";this._rendererController.handleStateTransition(a.RENDERER_STATE_STARTED);}},onAdLinearChange:function(){a.log("VPAIDRenderer: onAdLinearChange()");var b=this.vpaidCreative.getAdLinear();b?a.log("onAdLinearChange(): non-linear click to linear -> request content video to pause"):a.log("onAdLinearChange(): linear back to non-linear -> request content video to resume");this._rendererController.requestContentStateChange(b);},
  onAdSizeChange:function(){a.log("VPAIDRenderer: onAdSizeChange()");},onAdPaused:function(){a.log("VPAIDRenderer: onAdPaused()");"playing"===this.adPlaybackState&&this._rendererController.processEvent({name:a.EVENT_AD_PAUSE});this.adPlaybackState="paused";},onAdResumed:function(){a.log("VPAIDRenderer: onAdResumed()");"paused"===this.adPlaybackState&&this._rendererController.processEvent({name:a.EVENT_AD_RESUME});this.adPlaybackState="playing";},onAdSkipped:function(){a.log("VPAIDRenderer: onAdSkipped()");
  this.dispose();this._rendererController.handleStateTransition(a.RENDERER_STATE_COMPLETED);},onAdVideoFirstQuartile:function(){a.log("VPAIDRenderer: onAdVideoFirstQuartile()");this._rendererController.processEvent({name:a.EVENT_AD_FIRST_QUARTILE});},onAdVideoMidpoint:function(){a.log("VPAIDRenderer: onAdVideoMidpoint()");this._rendererController.processEvent({name:a.EVENT_AD_MIDPOINT});},onAdVideoThirdQuartile:function(){a.log("VPAIDRenderer: onAdVideoThirdQuartile()");this._rendererController.processEvent({name:a.EVENT_AD_THIRD_QUARTILE});},
  onAdVideoComplete:function(){a.log("VPAIDRenderer: onAdVideoComplete");this._rendererController.processEvent({name:a.EVENT_AD_COMPLETE});},onAdUserAcceptInvitation:function(){a.log("VPAIDRenderer: onAdUserAcceptInvitation()");this._rendererController.processEvent({name:a.EVENT_AD_ACCEPT_INVITATION});},onAdUserClose:function(){a.log("VPAIDRenderer: onAdUserClose()");this._rendererController.processEvent({name:a.EVENT_AD_CLOSE});},onAdUserMinimize:function(){a.log("VPAIDRenderer: onAdUserMinimize()");
  this._rendererController.processEvent({name:a.EVENT_AD_MINIMIZE});},onAdLog:function(b){a.log("VPAIDRenderer: onAdLog: "+b);},onAdError:function(b){a.log("VPAIDRenderer: onAdError(): "+b);this._failWithError(a.ERROR_3P_COMPONENT,"AdError event:"+b);},start:function(b){a.log("VPAIDRenderer start()");this._rendererController=b;this.timePositionClass=this._rendererController.getAdInstance().getSlot().getTimePositionClass();this.rendition=this._rendererController.getAdInstance().getActiveCreativeRendition();
  this._initParams();if(b=(b=this.rendition?this.rendition.getPrimaryCreativeRenditionAsset():null)?b.getProxiedUrl():null){this.vpaidCreative=new a.VPAIDWrapper;this.vpaidCreative._autoPauseAdOnVisibilityChange=this._rendererController.getParameter(a.PARAMETER_AUTO_PAUSE_AD_ONVISIBILITYCHANGE);this.vpaidCreative._isCORSEnforcementDisabled=this._isCORSEnforcementDisabled;this.vpaidCreative.setTimeoutValueInMs(this.creativeTimeoutDelayInMs);this.vpaidCreative.addEventListener("loaderror",this.onCreativeLoadError.bind(this));
  this.vpaidCreative.addEventListener("timeout",this.onCreativeTimeout.bind(this));this.vpaidCreative.addEventListener("CreativeAssetLoaded",this.onCreativeAssetLoaded.bind(this));try{this.vpaidCreative.loadCreativeAsset(b);}catch(c){a.warn(c),this._isCORSEnforcementDisabled?(this._failWithError(a.ERROR_UNKNOWN,"Error when loading creative"+c),this.cancelTimeoutEvent()):that._eventHandlers.loaderror(a.ERROR_UNKNOWN,"Error when loading creative: "+c);}}else this._failWithError(a.ERROR_NULL_ASSET,"Creative asset url cannot be null");},
  stop:function(){a.log("VPAIDRenderer stop()");this.vpaidCreative.stopAd();"loadCreativeAsset and stopAd"==this.vpaidCreative.getTimeoutOperation()&&this.dispose();},info:function(){return {moduleType:a.MODULE_TYPE_RENDERER}},getPlayheadTime:function(){var a=this.vpaidCreative.getAdDuration(),c=this.vpaidCreative.getAdRemainingTime();0<=a&&0<=c&&(this.playheadTime=a-c);0>this.playheadTime&&(this.playheadTime=-1);return this.playheadTime},getDuration:function(){var a=this.vpaidCreative.getAdDuration();
  return 0<=a?a:-1},pause:function(){a.log("VPAIDRenderer pause()");this._rendererController.processEvent({name:a.EVENT_AD_PAUSE});this.vpaidCreative.canPauseAd()?"playing"===this.adPlaybackState&&(this.adPlaybackState="pausing",this.vpaidCreative.pauseAd()):a.log("The creative is not able to pause");},resume:function(){a.log("VPAIDRenderer resume()");this._rendererController.processEvent({name:a.EVENT_AD_RESUME});this.vpaidCreative.canResumeAd()?"paused"===this.adPlaybackState&&(this.adPlaybackState=
  "resuming",this.vpaidCreative.resumeAd()):a.log("The creative is not able to resume");},dispose:function(){a.log("VPAIDRenderer dispose()");this.vpaidCreative&&(this.videoParent&&(this.videoParent.removeChild(this.videoBase),this.videoParent=null),this._visibilityChangeListener&&this.vpaidCreative._autoPauseAdOnVisibilityChange&&(a.log("remove visibilitychange listener"),document.removeEventListener("visibilitychange",this._visibilityChangeListener,!1)),this.vpaidCreative.removeCallbacksForCreative(this.creativeEventCallbacks),
  this.vpaidCreative.removeEventListener("CreativeAssetLoaded"),this.vpaidCreative.removeEventListener("timeout"),this.vpaidCreative.removeEventListener("loaderror"),this.vpaidCreative=null);},resize:function(){a.log("VPAIDAdRenderer resize()");var b=this._rendererController.getAdInstance().getSlot(),c=b.getWidth();b=b.getHeight();a.log("VPAIDRenderer new size width:"+c+" height:"+b);this.vpaidCreative.resizeAd(c,b,this.vpaidViewmode);}});a.VastTranslator=function(){this._rendererController=this._request=
  null;};a.VastTranslator.prototype={start:function(b){function c(b){a.log("VastTranslator\t"+b);}function d(b){a.warn("VastTranslator\t"+b);}function e(a,b){if(a)if(a.length&&"string"!==typeof a)for(var c=0;c<a.length;c++)b(a[c].value);else a.value&&b(a.value);}function f(a,b){e(b,function(b){b&&a.push(b);});}function h(b){if(!b)return !1;for(var c=0;c<C.length;c++)if(a.Util.trim(C[c]).toLowerCase()===a.Util.trim(b).toLowerCase())return !0;return !1}function g(b){if(!b)return null;"string"!==typeof b&&(b=b.toString());
  b=a.Util.trim(b);return -1<b.indexOf("://")?b:null}function m(a){this.code=this.url=null;this.height=this.width=NaN;this.resourceType=this.creativeType=null;this.bitrate=NaN;this.creativeApi=null;this.ad=a;this.clickThrough=null;this.clickTrackings=[];this.customClicks=[];this.creativeData=null;}function l(){this.creativeView=[];this.start=[];this.firstQuartile=[];this.midpoint=[];this.thirdQuartile=[];this.complete=[];this.mute=[];this.unmute=[];this.pause=[];this.rewind=[];this.resume=[];this.replay=
  [];this.fullscreen=[];this.expand=[];this.collapse=[];this.acceptInvitation=[];this.stop=[];}function n(a){this._impressions=[];this.clickThrough=null;this.clickTrackings=[];this.customClicks=[];this.creativeData=null;this.sequence=-1;this.universalAdId=null;this.vastRenditions=[];this.duration=NaN;this.adp=a;this.isDrivingAd=!1;}function q(a){n.call(this,a);}function r(a){n.call(this,a);}function u(a){n.call(this,a);}function I(){}function k(a,b,d,e){if(a&&e&&0<e.length){c("augmentCallbacks("+b+", "+
  d+", "+e+")");for(var f=a.getEventCallbackUrls(b,d),p=0;p<f.length;p++)-1<e.indexOf(f[p])&&(c("augmentCallbacks() url = "+f[p]),e.unshift(f[p]));a.addEventCallbackUrls(b,d,e);}else c("augmentCallbacks("+b+", "+d+", "+e+"), empty callbacks");}function z(b,d){c("initErrorTrackings()");b&&d&&k(b,a.EVENT_ERROR,a.EVENT_TYPE_ERROR,d.errorTrackings);}function J(b,d){c("initTrackingEvents()");d&&b&&(k(b,a.EVENT_AD_IMPRESSION,a.EVENT_TYPE_IMPRESSION,d.creativeView),k(b,a.EVENT_AD_IMPRESSION,a.EVENT_TYPE_IMPRESSION,
  d.start),k(b,a.EVENT_AD_FIRST_QUARTILE,a.EVENT_TYPE_IMPRESSION,d.firstQuartile),k(b,a.EVENT_AD_MIDPOINT,a.EVENT_TYPE_IMPRESSION,d.midpoint),k(b,a.EVENT_AD_THIRD_QUARTILE,a.EVENT_TYPE_IMPRESSION,d.thirdQuartile),k(b,a.EVENT_AD_COMPLETE,a.EVENT_TYPE_IMPRESSION,d.complete),k(b,a.EVENT_AD_MUTE,a.EVENT_TYPE_STANDARD,d.mute),k(b,a.EVENT_AD_UNMUTE,a.EVENT_TYPE_STANDARD,d.unmute),k(b,a.EVENT_AD_PAUSE,a.EVENT_TYPE_STANDARD,d.pause),k(b,a.EVENT_AD_RESUME,a.EVENT_TYPE_STANDARD,d.resume),k(b,a.EVENT_AD_REWIND,
  a.EVENT_TYPE_STANDARD,d.rewind),k(b,a.EVENT_AD_EXPAND,a.EVENT_TYPE_STANDARD,d.fullscreen),k(b,a.EVENT_AD_COLLAPSE,a.EVENT_TYPE_STANDARD,d.collapse),k(b,a.EVENT_AD_EXPAND,a.EVENT_TYPE_STANDARD,d.expand),k(b,a.EVENT_AD_CLOSE,a.EVENT_TYPE_STANDARD,d.stop),k(b,a.EVENT_AD_ACCEPT_INVITATION,a.EVENT_TYPE_STANDARD,d.acceptInvitation));}function O(b,d,e,f,g){c("initClickAndImpressionEvents");if(b){d&&b.setClickThroughUrl(a.EVENT_AD_CLICK,d);e&&0<e.length&&k(b,a.EVENT_AD_CLICK,a.EVENT_TYPE_CLICK_TRACKING,e);
  if(f&&0<f.length)for(d=0;d<f.length;d++)f[d].url&&k(b,f[d].id,a.EVENT_TYPE_CLICK_TRACKING,[f[d].url]);g&&k(b,a.EVENT_AD_IMPRESSION,a.EVENT_TYPE_IMPRESSION,g);}}function P(a,b){c("initTemporalAdInstance");a||d("initTemporalAdInstance: Invalid adInstance");if(b.selectedDrivingAd){b.surveyUrl&&a._creative.setParameter("_fw_survey_url",b.surveyUrl);var e=b.selectedDrivingAd,f=b.selectedDrivingRenditions;c("vastRenditions:"+f);for(var p=4===H,g=0;g<f.length;g++){var m=a.addCreativeRendition();var l=m.addCreativeRenditionAsset("VAST_CRA",
  !0);var k=f[g];a:{var y=k.creativeType;switch(y){case "video/mp4":y="video/mp4-h264";break a;case "video/3gp":y="video/3gpp";}}c("initTemporalAdInstance() set rendition/asset [vastRd.creativeApi,vastAd.duration,vastRd.width,vastRd.height,vastRd.url,assetContentType,vastRd.creativeType] =  "+[k.creativeApi,e.duration,k.width,k.height,k.url,y,k.creativeType]);m.setCreativeApi(k.creativeApi);isNaN(e.duration)||m.setDuration(e.duration);k.width&&!isNaN(k.width)&&m.setWidth(k.width);k.height&&!isNaN(k.height)&&
  m.setHeight(k.height);e.universalAdId&&m.setUniversalAdId(e.universalAdId);k.url&&l.setUrl(k.url);k.code&&l.setContent(k.code);l.setMimeType(k.creativeType);"static"===k.resourceType&&"text/html"===k.creativeType?l.setContentType("text/html_doc_ref"):"application/x-javascript"===k.creativeType||"application/javascript"===k.creativeType?l.setContentType("text/js_ref"):"iframe"===k.resourceType?l.setContentType("text/html_doc_ref"):"text/html"===k.creativeType||"text/html_doc_ref"===k.creativeType?
  l.setContentType("text/html_doc_ref"):"text/html_doc_lit_mobile"===k.creativeType?l.setContentType("text/html_doc_lit_mobile"):p||h(y)?(l.setContentType("text/html_doc_lit_mobile"),l.setUrl(null),l.setContent(w(a,F.getCustomId(),e,k,"text/html_doc_lit_mobile"))):l.setContentType(y);e.creativeData&&0!==e.creativeData.length&&(c("initTemporalAdInstance(), set asset parameter creativeData:"+e.creativeData),m.setParameter("creativeData",e.creativeData));p||h(y)||(k=k.bitrate,!isNaN(k)&&0<k&&l.setBytes(1E3*
  k*e.duration/8));y=D;l=G;k=!1;if(m.getContentType()&&y){var n=m.getContentType().toLowerCase(),q=y.toLowerCase();if(n===q)k=!0;else if(0===n.indexOf("video/mp4")&&0===q.indexOf("video/mp4")||"application/javascript"===q&&"text/js_ref"===n)m.setContentType(y),k=!0;}y=!1;m.getCreativeApi()&&l&&(n=m.getCreativeApi().toLowerCase(),q=l.toLowerCase(),n===q?y=!0:0===n.indexOf("mraid")&&0===q.indexOf("mraid")&&(y=!0,m.setCreativeApi(l)));k&&y?m.setPreference(10):y?m.setPreference(6):k?m.setPreference(5):m.setPreference(0);
  c("adjustMatchedRendition "+m.getId()+", contentType "+m.getContentType()+", creativeAPI "+m.getCreativeApi()+", preference "+m.getPreference());}J(a,e.trackingEvents);z(a,b);O(a,p?f[0].clickThrough:e.clickThrough,e.clickTrackings,e.customClicks,e.impressions);}else m=a.addCreativeRendition(),m.setContentType("null/null"),l=m.addCreativeRenditionAsset("VAST_CRA",!0),l.setContentType("null/null");}function w(b,d,e,f,g){c("getCoadHTML, ad id = "+b.getAdId());return f.url&&0<f.url.length?((e=f.clickThrough)&&
  0<e.length&&b.setClickThroughUrl(a.EVENT_AD_CLICK,e),b=b.getEventCallbackUrls(a.EVENT_AD_CLICK,a.EVENT_TYPE_CLICK)[0],a.HTMLAdGenerator.generateAd(f.url,b,d,f.width,f.height,f.creativeType,g)):f.code&&0<f.code.length?"script"===f.resourceType||"text/javascript"===f.resourceType||"text/js_ref"===f.resourceType||"application/x-javascript"===f.resourceType?a.HTMLAdGenerator.wrapJSCode(f.code,d,f.width,f.height):a.HTMLAdGenerator.wrapUnsafeHTML(f.code,d,f.width,f.height):null}function L(b,d,e,f){c("initPageAdInstance ad:"+
  d.getAdId());var p=e.vastRenditions[0];if(p.url||p.code){var g=d.addCreativeRendition(),h=g.addCreativeRenditionAsset("VAST_CRA",!0);g.setCreativeApi(p.creativeApi);g.setWidth(p.width);g.setHeight(p.height);"static"===p.resourceType&&"text/html"===p.creativeType||"iframe"===p.resourceType?(h.setContentType("text/html_doc_ref"),h.setUrl(p.url)):"HTML"===p.resourceType?(h.setContentType("text/html_doc_lit_mobile"),h.setContent(a.HTMLAdGenerator.wrapUnsafeHTML(p.code,b.getCustomId(),p.width,p.height))):
  (h.setContentType("text/html_doc_lit_mobile"),h.setContent(w(d,b.getCustomId(),e,p,"text/html_doc_lit_mobile")));h.setMimeType("text/html");}else c("initPageAdInstance will add a tracking only companion ad");J(d,e.trackingEvents);z(d,f);O(d,p.clickThrough,p.clickTrackings,p.customClicks,e.impressions);}function t(b){if(200===b.status)if(b.responseXML){var d=(new I).parseAdData(b.responseXML);if(d){c("scheduleVastAds");if(d&&0!==d.length)if(b=d[0].selectedPackage,d=d[0].redirectPackage,!b&&!d)if(c("scheduleVastAds(), no ads from vast response!!!"),
  E)if(4!==H)v.onTranslatorFailed(a.ERROR_NO_AD_AVAILABLE,"Expecting linear ad but returned non-linear ad",a.ERROR_VAST_LINEARITY_NOT_MATCH);else v.onTranslatorFailed(a.ERROR_NO_AD_AVAILABLE,"Expecting non-linear ad but returned linear ad",a.ERROR_VAST_LINEARITY_NOT_MATCH);else v.onTranslatorFailed(a.ERROR_NO_AD_AVAILABLE,"wrapperUrl="+A);else if(!b&&d){c("scheduleVastAds(), no ads scheduled, redirect to downstream Secondary Ad Server");c("scheduleRedirect");b=[];var e=[];b.push(F);e.push({});for(var f=
  Q,g=d.selectedCompanionAds,p=0;p<f.length;p++){var h=f[p];g&&g[h.getCustomId()]&&(b.push(h),e.push(g[h.getCustomId()]));}(f=v._rendererController.scheduleAdInstances(b))&&0<f.length&&(g=f[0],p=g.addCreativeRendition(),p.setWrapperUrl(a.Util.transformUrlToProxy(d.tagUrl)),p.setWrapperType(R),p.setContentType(D),p.setCreativeApi(G),J(g,d.getTrackingEventsOfWrapper()),z(g,d),O(g,d.getClickThroughOfWrapper(),d.getClickTrackingsOfWrapper(),d.getCustomClicksOfWrapper(),d.getImpressionOfWrapper()));c("scheduleRedirect, schedule companion for redirect ad "+
  d);for(p=1;p<f.length;p++)if(g=f[p])h=e[p],h instanceof u&&L(b[p],g,h,d);}else {if(b){c("scheduleVastAds(), ads returned from vast response, going to schedule them");b.selectedDrivingAd?(c("scheduleVastAds(), ads returned from vast response, going to schedule them with driving ad"),b.selectedDrivingAd.isDrivingAd=!0):c("scheduleVastAds(), ads returned from vast response, going to schedule them without driving ad");c("scheduleAdPackage()");d=[];e=[];d.push(F);b.selectedDrivingAd&&e.push(b.selectedDrivingAd);
  f=Q;g=b.selectedCompanionAds;for(p=0;p<f.length;p++)h=f[p],g&&g[h.getCustomId()]&&(d.push(h),e.push(g[h.getCustomId()]));g=v._rendererController.scheduleAdInstances(d);if(0<g.length){c("scheduleAdPackage, scheduled "+g.length+" ads"+b.selectedDrivingAd?"":", 1 of it is nullAd for pure companion ad schedule");b.selectedDrivingAd||c("Driving ad is not selected, will create a dummy null ad.");b.selectedDrivingAd||(d.shift(),P(g.shift(),b));for(p=0;p<g.length;p++)if(h=g[p]){var k=e[p];k instanceof u?
  L(d[p],h,k,b):P(h,b);}!b.selectedDrivingAd&&0<f.length&&0<b.companionAds.length&&0===e.length&&(c("found empty companion slots and companion ads in package, but none of them matches slot size"),v.onTranslatorFailed(a.ERROR_UNMATCHED_SLOT_SIZE));}else c("scheduleAdPackage, no ad scheduled.");}}else c("no ads for scheduleVastAds");v._request=null;v._rendererController.handleStateTransition(a.TRANSLATOR_STATE_STARTED);v._rendererController.handleStateTransition(a.TRANSLATOR_STATE_COMPLETED);}}else v.onTranslatorFailed(a.ERROR_PARSE,
  "wrapperUrl="+A,a.ERROR_VAST_XML_PARSING);else if(400<=b.status)v.onTranslatorFailed(a.ERROR_IO,"wrapperUrl="+A);}this._rendererController=b;var C="image/gif image/jpeg image/png text/html text/javascript text/html_doc_ref text/html_doc_lit_mobile application/x-javascript application/javascript".split(" "),E=!1,x=this._rendererController.getAdInstance(),v=this,F=x.getSlot(),H=function(){if(!F)return 1;switch(F.getTimePositionClass()){case a.TIME_POSITION_CLASS_PREROLL:case a.TIME_POSITION_CLASS_MIDROLL:case a.TIME_POSITION_CLASS_POSTROLL:return 2;
  case a.TIME_POSITION_CLASS_OVERLAY:return 4;case a.TIME_POSITION_CLASS_DISPLAY:return F&&!F.getBase()?8:1;default:return 1}}(),Q=this._rendererController.getCompanionSlots().filter(function(b){if(!b)return !1;switch(b.getTimePositionClass()){case a.TIME_POSITION_CLASS_PREROLL:case a.TIME_POSITION_CLASS_MIDROLL:case a.TIME_POSITION_CLASS_PAUSE_MIDROLL:case a.TIME_POSITION_CLASS_POSTROLL:return !1;default:return !0}});c("Checking CompanionSlots, length = "+Q.length+", this._rendererController.getCompanionSlots().length = "+
  this._rendererController.getCompanionSlots().length+", AdInstance.getCompanionSlots.length = "+x.getCompanionSlots().length);var D=x.getActiveCreativeRendition().getContentType(),G=x.getActiveCreativeRendition().getCreativeApi()||"None";this.log("ExpectedDrivingContentType:"+D+", ExpectedDrivingAPI:"+G);var R=x.getActiveCreativeRendition().getWrapperType();m.prototype={init:function(a,b,c,d,e,f,g,h){this.log("init("+[].slice.call(arguments,0).join(",")+")");this.url=a;this.width=1*b;this.height=1*
  c;this.creativeType=d;this.resourceType=e;this.bitrate=f;var p;if((p=g)&&0!==p.length)switch(p.toLowerCase()){case "flashvar":case "flashvars":p="clickTag";break;case "vpaid":p="VPAID";break;case "mraid":p="MRAID-1.0";}else p="None";this.creativeApi=p;this.code=h||null;},log:function(b){a.log("VastTranslator.VastRendition\t"+b);},toString:function(){var a=[],b;for(b in this)this.hasOwnProperty(b)&&"function"!==typeof this[b]&&"ad"!==b&&a.push(b+":"+this[b]);return a.join(",")}};m.prototype.constructor=
  m;n.prototype={parse:function(b){this.log("parse()");if(b.Duration)if(b.Duration.value){var c=/(\d+):(\d+):(\d+)/.exec(b.Duration.value);c?this.duration=3600*c[1]+60*c[2]+1*c[3]:this.warn("Failed to parse duration value for creative "+b);}else this.warn("No duration value set for creative "+b);b.VideoClicks&&(b.VideoClicks=[].concat(b.VideoClicks),a.Util.forEachOnArray(b.VideoClicks,function(a){a.ClickThrough&&a.ClickThrough.value&&(this.clickThrough=g(a.ClickThrough.value));var b;if(a.ClickTracking){a.ClickTracking=
  [].concat(a.ClickTracking);for(var c=0;c<a.ClickTracking.length;c++)(b=g(a.ClickTracking[c].value))&&this.clickTrackings.push(b);}if(a.CustomClick)for(a.CustomClick=[].concat(a.CustomClick),c=0;c<a.CustomClick.length;c++){var d=null;a.CustomClick[c]["@attributes"]&&(d=a.CustomClick[c]["@attributes"].id);(b=g(a.CustomClick[c].value))&&this.customClicks.push({id:d,url:b});}},this));b.MediaFiles&&b.MediaFiles.MediaFile&&(b.MediaFiles.MediaFile=[].concat(b.MediaFiles.MediaFile),a.Util.forEachOnArray(b.MediaFiles.MediaFile,
  function(a){var b=g(a.value),c=NaN,d=NaN,e=null,f="None",h=NaN;a["@attributes"]&&(c=a["@attributes"].width||NaN,d=a["@attributes"].height||NaN,e=a["@attributes"].type,f=a["@attributes"].apiFramework||"None",h=a["@attributes"].bitrate||NaN);b&&-1!==b.indexOf(":")?(a=new m(this),a.init(b,c,d,e,"",h,f,null),a.clickThrough=this.clickThrough,this.vastRenditions.push(a),(isNaN(c)||isNaN(d))&&this.log("continue with missing [width,height]"+[c,d])):this.warn("will ignore this mediaFile because some required field is missing [url,width,height]:"+
  [b,c,d]);},this));b.TrackingEvents&&this.parseTrackingEvents(b.TrackingEvents,this.setTrackingEvents());b.AdParameters&&(this.log("parse() got AdParameters:"+b.AdParameters.value),this.creativeData=b.AdParameters.value);b.Companion&&(b.Companion=[].concat(b.Companion),a.Util.forEachOnArray(b.Companion,function(b){var c=null,d=null,e="",f="",p=null,k=null,l=!1;b.CompanionClickThrough&&(f=g(b.CompanionClickThrough.value));b.StaticResource&&(c=g(b.StaticResource.value),b.StaticResource["@attributes"]&&
  (d=b.StaticResource["@attributes"].creativeType),e="static");b.IFrameResource&&(c=g(b.IFrameResource.value))&&(d="text/html_doc_ref",e="iframe");b.HTMLResource&&(p=b.HTMLResource["#cdata-section"]||"",p=a.Util.trim(p))&&(d="text/html_doc_lit_mobile",e="HTML");b.TrackingEvents&&(k=b.TrackingEvents);var S=new u(this.adp);S.sequence=this.sequence;S.clickThrough=f;k&&S.parseTrackingEvents(k,S.setTrackingEvents());if(b["@attributes"]){k=b["@attributes"].width||NaN;var y=b["@attributes"].height||NaN;b=
  b["@attributes"].apiFramework||"None";if((c&&-1!==c.indexOf(":")||p)&&!isNaN(k)&&!isNaN(y)&&h(d)||this.adp.isWrapper){var n=new m(S);n.init(c,k,y,d,e,NaN,b,p);n.clickThrough=f;S.vastRenditions.push(n);}else l=!0,this.warn("will ignore this rendition because some required fields is missing or incompatible [creativeType,url,code,width,height]:"+[d,c,p,k,y]);}else this.adp.isWrapper||(l=!0,this.warn("for InLine ad package, No attributes found for the Companion ads:"+b));l?this.adp.isWrapper&&this.adp.companionAds.push(S):
  this.adp.companionAds.push(S);},this));b.NonLinear&&(b.NonLinear=[].concat(b.NonLinear),a.Util.forEachOnArray(b.NonLinear,function(b){var c=null,d=null,e="",f="",p="",k=null,l=!1;b.AdParameters&&(p=b.AdParameters.value);b.NonLinearClickThrough&&(f=g(b.NonLinearClickThrough.value));b.StaticResource&&(c=g(b.StaticResource.value),b.StaticResource["@attributes"]&&(d=b.StaticResource["@attributes"].creativeType),e="static");b.IFrameResource&&(c=g(b.IFrameResource.value),d="text/html_doc_ref",e="iframe");
  b.HTMLResource&&(k=b.HTMLResource["#cdata-section"]||"",k=a.Util.trim(k),d="text/html_doc_lit_mobile",e="HTML");var y=new r(this.adp);y.sequence=this.sequence;y.clickThrough=f;y._trackingEvents=this._trackingEvents;p&&(y.creativeData=p);if(b["@attributes"]){p=b["@attributes"].width||NaN;var S=b["@attributes"].height||NaN;b=b["@attributes"].apiFramework||"None";if(!c&&!k||isNaN(p)||isNaN(S)||!h(d))l=!0,this.warn("will ignore this rendition because some required fields is missing or incompatible:[creativeType,url,code,width,height]:"+
  [d,c,k,p,S]);else {var n=new m(y);n.init(c,p,S,d,e,NaN,b,k);n.clickThrough=f;y.vastRenditions.push(n);}}else this.adp.isWrapper||(l=!0,this.warn("for InLine ad package, No attributes found for the NonLinear ads:"+b));this.adp.nonLinearAds.push(y);l?this.adp.isWrapper&&this.adp.nonLinearAds.push(y):this.adp.nonLinearAds.push(y);},this));},parseLinears:function(a){2!==H?(this.log("TargetAdType != TARGET_LINEAR, skipping parse"),E=!0):this.parse(a);},parseNonLinears:function(a){4!==H?(this.log("TargetAdType != TARGET_NONLINEAR, skipping parse"),
  E=!0):this.parse(a);},parseCompanionAds:function(a){this.parse(a);},setTrackingEvents:function(){this._trackingEvents||(this._trackingEvents=new l);return this._trackingEvents},parseTrackingEvents:function(b,c){this.log("parseTrackingEvents");b.Tracking&&(b.Tracking=[].concat(b.Tracking),a.Util.forEachOnArray(b.Tracking,function(a){var b=a["@attributes"].event;if(a=g(a.value))switch(b){case "creativeView":case "start":case "firstQuartile":case "midpoint":case "thirdQuartile":case "complete":case "mute":case "unmute":case "pause":case "resume":case "rewind":case "replay":case "fullscreen":case "expand":case "collapse":case "acceptInvitation":case "stop":c[b].push(a);
  break;case "close":c.stop.push(a);}},this));},toString:function(){return this.constructor.name+", renditions:"+this.vastRenditions},log:function(b){a.log("VastTranslator."+this.constructor.name+"\t"+b);},warn:function(b){a.warn("VastTranslator."+this.constructor.name+"\t"+b);}};b=Object.defineProperty||function(a,b,c){c.get&&a.__defineGetter__(b,c.get);c.set&&a.__defineSetter__(b,c.set);};b(n.prototype,"trackingEvents",{get:function(){this.log("get trackingEvents()");return this._trackingEvents?this._trackingEvents:
  this.isDrivingAd?this.adp.trackingEvents:null}});b(n.prototype,"impressions",{set:function(a){this._impressions=a;},get:function(){return this.isDrivingAd?this._impressions.concat(this.adp.impressions):this._impressions}});n.prototype.constructor=n;q.prototype=new n;q.prototype.constructor=q;r.prototype=new n;r.prototype.constructor=r;u.prototype=new n;u.prototype.getPrimaryRendition=function(){return this.vastRenditions[0]||null};b(u.prototype,"impressions",{get:function(){return 8===H?this._impressions.concat(this.adp.impressions):
  this._impressions}});u.prototype.constructor=u;var M=function(){this.impressions=[];this.errorTrackings=[];this.linearAds=[];this.nonLinearAds=[];this.companionAds=[];this.extensions=[];this.tagUrl="";this.isWrapper=!1;this.surveyUrl=null;this.selectedDrivingRenditions=[];this.selectedDrivingAd=null;this.selectedCompanionAds={};};M.prototype={parse:function(a){this.log("parse("+a+")");if(a)if(this.isWrapper||a.Creatives&&a.Creatives.Creative){a.Creatives=a.Creatives||[];f(this.impressions,a.Impression);
  f(this.extensions,a.Extensions);f(this.errorTrackings,a.Error);this.isWrapper&&a.VASTAdTagURI&&(this.tagUrl=a.VASTAdTagURI.value||"");a.Survey&&a.Survey.value&&0<a.Survey.value.length&&(this.surveyUrl=a.Survey.value);a.Creatives.Creative=a.Creatives.Creative?[].concat(a.Creatives.Creative):[];for(var b=0;b<a.Creatives.Creative.length;b++){var c=a.Creatives.Creative[b],d=-1;c["@attributes"]&&(d=c["@attributes"].sequence||-1,d*=1);if(c.Linear){var e=new q(this);e.sequence=d;e.parseLinears(c.Linear);
  this.linearAds.push(e);}else c.NonLinearAds?(e=new r(this),e.sequence=d,e.parseNonLinears(c.NonLinearAds)):c.CompanionAds&&(e=new u(this),e.sequence=d,e.parseCompanionAds(c.CompanionAds));e&&c.UniversalAdId?(e.universalAdId={idRegistry:c.UniversalAdId["@attributes"].idRegistry,idValue:c.UniversalAdId["@attributes"].idValue},this.log("Universal Ad ID with idRegistry "+e.universalAdId.idRegistry+" and idValue "+e.universalAdId.idValue)):this.log("No Universal Ad ID is present in the VAST response.");}}else this.warn("parse(): no creative found!");
  else this.warn("parse(): empty adpackage");},testAndUpdatePackageForTemporalSlot:function(a){this.log("testAndUpdatePackageForTemporalSlot("+a+")");a=a?this.linearAds:this.nonLinearAds;if(1>a.length)return !1;this.log("testAndUpdatePackageForTemporalSlot(), ads.length = "+a.length+"");var b=!1;if(!b)for(var c=0;c<a.length;c++){var d=this.findRenditionGroupByContentType(a[c]);if(0<d.length){this.log("testAndUpdatePackageForTemporalSlot() : found driving ad and renditions group: "+d);this.selectedDrivingRenditions=
  d;this.selectedDrivingAd=a[c];b=!0;break}}return b},testAndUpdatePackageForPageSlots:function(a){var b=!1,c=this.companionAds,d=Q.slice(0);this.log("testAndUpdatePackageForPageSlots("+a+"), ads are "+c.join(",")+", slots are "+d.join(","));if(a){if(a=this.matchAdsToSlots(c,d),0<a.length)for(b=!0,c=0;c<a.length;c++){d=a[c];var e=d.ad;this.selectedCompanionAds[d.slot.getCustomId()]=e;}}else a=this.matchAdsToSlots(c,[F]),1===a.length?(b=!0,this.selectedDrivingAd=a[0].ad):this.selectedDrivingAd=null;return b},
  renditionFitsInSlot:function(a,b){return a?a.width<=b.getWidth()&&a.height<=b.getHeight():!1},calcDeadSpaceRatio:function(a,b){a=a.getPrimaryRendition();if(!a)return 0;this.log("ad w,h  slot w,h"+[a.width,a.height,b.getWidth(),b.getHeight()]);return this.renditionFitsInSlot(a,b)?1-a.width*a.height/b.getWidth()*b.getHeight():1},matchAdsToSlots:function(a,b){this.log("matchAdsToSlots(ads="+a.join(",")+", slots="+b.join(",")+")");for(var c=[],d=null,e=null,f=1,g=0;g<a.length;g++)for(var h=a[g],k=0;k<
  b.length;k++){var l=b[k],m=this.calcDeadSpaceRatio(h,l);m<f&&(d=h,e=l,f=m);}null!=d&&(c.push({ad:d,slot:e}),a.splice(a.indexOf(d),1),b.splice(b.indexOf(e),1),c=c.concat(this.matchAdsToSlots(a,b)));this.log("matchAdsToSlots: winningAd:"+d+" winningSlot:"+e+" ratio:"+f);return c},getAllRenditions:function(a){return a.vastRenditions},findRenditionGroupByContentType:function(b){this.log("findRenditionGroupByContentType:"+b);var c=[];if(b instanceof q&&isNaN(b.duration))return this.warn("findRenditionGroupByContentType(), duration of linear ad is NaN, will not used for scheduling"),
  c;for(var d=this.getAllRenditions(b),e=0;e<d.length;e++){var f=d[e];if(b instanceof q){if(null==f.creativeType||""===a.Util.trim(f.creativeType)){this.warn("findRenditionGroupByContentType, the contentType "+f.creativeType+" not supported for linearAd");continue}}else if(!h(f.creativeType)){this.warn("findRenditionGroupByContentType, the contentType "+f.creativeType+" not supported for non-linearAd");continue}c.push(f);}return c},formalizeString:function(b){return b?a.Util.trim(b).toLowerCase():""},
  getAdsByTargetType:function(){this.log("getAdsByTargetType");var a=[];switch(H){case 8:a=this.companionAds;break;case 2:a=this.linearAds;break;case 4:a=this.nonLinearAds;}for(var b=0;b<a.length;b++)a[b].isDrivingAd=!0;return a},getImpressionOfWrapper:function(){this.log("getImpressionOfWrapper");for(var a=this.getAdsByTargetType(),b=null,c=0;c<a.length;c++){var d=a[c];if(d&&d._impressions&&0<d._impressions.length){b=d._impressions;break}}b||(b=this.impressions);return b},getTrackingEventsOfWrapper:function(){this.log("getTrackingEventsOfWrapper");
  for(var a=this.getAdsByTargetType(),b=null,c=0;c<a.length;c++){var d=a[c];if(d&&d._trackingEvents){b=d._trackingEvents;break}}return b},getClickThroughOfWrapper:function(){this.log("getClickThroughOfWrapper");for(var a=this.getAdsByTargetType(),b=null,c=0;c<a.length;c++){var d=a[c];if(d){d.clickThrough&&(b=d.clickThrough);d=d.vastRenditions;for(var e=0;e<d.length;e++){var f=d[e];if(f.clickThrough){b=f.clickThrough;break}}if(b)break}}return b},getClickTrackingsOfWrapper:function(){this.log("getClickTrackingsOfWrapper");
  for(var a=this.getAdsByTargetType(),b=null,c=0;c<a.length;c++){var d=a[c];if(d){d.clickTrackings&&0<d.clickTrackings.length&&(b=d.clickTrackings);d=d.vastRenditions;for(var e=0;e<d.length;e++){var f=d[e];if(f.clickTrackings&&0<f.clickTrackings.length){b=f.clickTrackings;break}}if(b)break}}return b},getCustomClicksOfWrapper:function(){this.log("getCustomClicksOfWrapper");for(var a=this.getAdsByTargetType(),b=null,c=0;c<a.length;c++){var d=a[c];if(d){d.customClicks&&0<d.customClicks.length&&(b=d.customClicks);
  d=d.vastRenditions;for(var e=0;e<d.length;e++){var f=d[e];if(f.customClicks&&0<f.customClicks.length){b=f.customClicks;break}}if(b)break}}return b},testWrapperForRedirect:function(){this.log("testAndUpdateWrapperForRedirect()");return this.tagUrl&&0<this.tagUrl.length},log:function(b){a.log("VastTranslator.VastAdPackage\t"+b);},warn:function(b){a.warn("VastTranslator.VastAdPackage\t"+b);}};M.prototype.constructor=M;I.prototype={getVastVersion:function(a){this.log("getVastVersion("+a+")");return a&&
  0!==a.indexOf(".")?0<a.indexOf(".")?parseInt(a.substring(0,a.indexOf("."))):parseInt(a):-1},parseAdData:function(b){this.log("parseAdData()");var c={},d;c.selectedPackage=null;c.redirectPackage=null;var e=a.Util.xmlToJson(b);if(e)if(e.VAST&&e.VAST["@attributes"])if(this.getVastVersion(e.VAST["@attributes"].version)<a.MINIMUM_VAST_VERSION_SUPPORTED||this.getVastVersion(e.VAST["@attributes"].version)>a.MAXIMUM_VAST_VERSION_SUPPORTED)v.onTranslatorFailed(a.ERROR_PARSE,"wrapperUrl="+A,a.ERROR_VAST_VERSION_NOT_SUPPORTED);
  else {if(e.VAST.Ad){e.VAST.Ad=[].concat(e.VAST.Ad);var f=[];b=[];for(d=0;d<e.VAST.Ad.length;d++){var g=new M;g.isWrapper=!!e.VAST.Ad[d].Wrapper;g.isWrapper?(g.parse(e.VAST.Ad[d].Wrapper),b.push(g)):(g.parse(e.VAST.Ad[d].InLine),f.push(g));}e=!1;if(0===f.length&&0===b.length)return this.log("parseAdData(): no ads from vast response!!!"),[c];this.log("parseAdData(): "+f.length+"inline ads, "+b.length+" wrapper ads.");g=null;for(d=0;d<f.length;d++)if(this.selectUsableAdsForDrivingSlot(f[d])){this.log("parseAdData(): package for driving slot is found!!!");
  g=f[d];break}d=0<Q.length&&x.getSlot().getTimePositionClass()!==a.TIME_POSITION_CLASS_DISPLAY;if(g)d&&this.selectUsableAdsCompanionSlots(g)&&this.log("parseAdData(): companion ads are found for companion slots, with driving slot"),c.selectedPackage=g;else if(d){d=!1;for(var h=0;h<f.length;h++)g=f[h],this.selectUsableAdsCompanionSlots(g)&&(this.log("parseAdData(): companion ads are found for companion slots,without driving slot"),c.selectedPackage=g,d=!0);d||(this.log("parseAdData(): companion ads are not found for companion slots,without driving slot"),
  e=!0);}else this.log("parseAdData(): no usable ads found in vast response!!!"),e=!0;if(e&&0<b.length)for(f=0;f<b.length;f++)if(this.testWrapperForRedirect(b[f])){c.redirectPackage=b[f];x.incrementWrapperCount();this.selectUsableAdsCompanionSlots(b[f])&&this.log("parseAdData(): companion ads are found for wrapper ad");break}return [c]}e.VAST.Error&&k(x,a.EVENT_ERROR,a.EVENT_TYPE_ERROR,e.VAST.Error.value);v.onTranslatorFailed(a.ERROR_NO_AD_AVAILABLE,"wrapperUrl="+A,a.ERROR_VAST_NO_AD);}else v.onTranslatorFailed(a.ERROR_PARSE,
  "wrapperUrl="+A,a.ERROR_VAST_SCHEMA_VALIDATION);else v.onTranslatorFailed(a.ERROR_PARSE,"wrapperUrl="+A,a.ERROR_VAST_XML_PARSING);},selectUsableAdsForDrivingSlot:function(a){this.log("selectUsableAdsForDrivingSlot()");switch(H){case 2:a=this.testAndUpdatePackageForTemporalSlot(a,!0);break;case 4:a=this.testAndUpdatePackageForTemporalSlot(a,!1);break;case 8:a=this.testAndUpdatePackageForPageSlots(a,!1);break;default:a=!1;}return a},selectUsableAdsCompanionSlots:function(a){this.log("selectUsableAdsCompanionSlots(pk)");
  return this.testAndUpdatePackageForPageSlots(a,!0)},testAndUpdatePackageForTemporalSlot:function(a,b){this.log("testAndUpdatePackageForTemporalSlot(pk,isLinear), isLinear = "+b);return a.testAndUpdatePackageForTemporalSlot(b)},testAndUpdatePackageForPageSlots:function(a,b){this.log("testAndUpdatePackageForPageSlots(pk,isCompanion) isCompanion = "+b);return a.testAndUpdatePackageForPageSlots(b)},testWrapperForRedirect:function(a){this.log("testWrapperForRedirect(pk)");return a.testWrapperForRedirect()},
  log:function(b){a.log("VastTranslator.VastParser\t"+b);},warn:function(b){a.warn("VastTranslator.VastParser\t"+b);}};var A=x.getActiveCreativeRendition().getWrapperUrl();b=x.getActiveCreativeRendition().getWrapperType();c("AdInstance.getActiveCreativeRendition().getWrapperUrl()="+A+", getWrapperType()="+b);if(0!==b.indexOf("external/vast-"))v.onTranslatorFailed(a.ERROR_NO_RENDERER,"wrapperType="+b+";wrapperUrl="+A,a.ERROR_VAST_TRACKING_ERROR);else if(A&&0!==A.length){var K=a.VAST_DEFAULT_MAX_WRAPPER_COUNT;
  (b=this._rendererController.getParameter(a.PARAMETER_VAST_MAX_WRAPPER_COUNT))&&0<Number(b)&&(K=Number(b));if(x.getWrapperCount()>=K)v.onTranslatorFailed(a.ERROR_IO,"maximum wrapper limit is reached "+x.getWrapperCount(),a.ERROR_VAST_WRAPPER_LIMIT_REACH);else {K=this._rendererController.getParameter("translator.vast.asyncLoad");K=!0===a.Util.str2bool(K);c("will load vast xml, asyncAjax:"+K);var T=this._rendererController.getParameter("translator.vast.loadWithCookie");T=!0===a.Util.str2bool(T);var B=
  null,U=5E3;(b=this._rendererController.getParameter(a.PARAMETER_VAST_TIMEOUT_IN_MILLISECONDS))&&0<Number(b)&&(U=Number(b));try{window.XDomainRequest?(B=new XDomainRequest,K=!0):(B=new XMLHttpRequest,B.withCredentials=T),v._request=B,K?(B.open("GET",A),window.XDomainRequest?B.onload=function(){var a=new ActiveXObject("Microsoft.XMLDOM");a.async=!1;a.loadXML(B.responseText);B.responseXML=a;B.status=200;t(B);}:(B.timeout=U,B.onreadystatechange=function(){4===B.readyState&&t(B);}),B.ontimeout=function(){v.onTranslatorFailed(a.ERROR_TIMEOUT,
  "wrapperUrl="+A+" timed out.",a.ERROR_VAST_URI_TIMEOUT);},B.onerror=function(){window.XDomainRequest&&(B.status=0);0===B.status?(d("CORS error"),v.onTranslatorFailed(a.ERROR_SECURITY,"wrapperUrl="+A)):(d("exception:"+B.statusText),v.onTranslatorFailed(a.ERROR_UNKNOWN,"wrapperUrl="+A+";exception="+B.statusText));},B.send()):(B.open("GET",A,!1),B.send(),t(B));}catch(p){b=!1;if(!window.XMLHttpRequestException)p.code===DOMException.NETWORK_ERR&&(d("CORS in IE10"),b=!0);else if(p instanceof XMLHttpRequestException)switch(p.code){case XMLHttpRequestException.NETWORK_ERR:b=
  !0;}b?(d("CORS error:"+p),v.onTranslatorFailed(a.ERROR_SECURITY,"wrapperUrl="+A)):(d("exception:"+p),v.onTranslatorFailed(a.ERROR_UNKNOWN,"wrapperUrl="+A+";exception="+p));}}}else v.onTranslatorFailed(a.ERROR_NULL_ASSET,"wrapperUrl="+A,a.ERROR_VAST_TRACKING_ERROR);},info:function(){return {moduleType:a.MODULE_TYPE_TRANSLATOR}},log:function(b){a.log("VastTranslator\t"+b);},warn:function(b){a.warn("VastTranslator\t"+b);},getPlayheadTime:function(){return -1},getDuration:function(){return -1},stop:function(){a.debug("VastTranslator stop");
  this._request&&(this._request.abort(),a.log("VastTranslator Stop: request aborted"));this._request=null;this._rendererController&&this._rendererController.handleStateTransition(a.TRANSLATOR_STATE_COMPLETED);},onTranslatorFailed:function(b,c,d){this._request&&(this._request=null);var e={};e[a.INFO_KEY_ERROR_MODULE]="VastTranslator";e[a.INFO_KEY_ERROR_CODE]=b;e[a.INFO_KEY_VAST_ERROR_CODE]=d;c&&(e[a.INFO_KEY_ERROR_INFO]=c);this._rendererController.handleStateTransition(a.TRANSLATOR_STATE_FAILED,e);}};
  a.VastTranslator.prototype.constructor=a.VastTranslator;a.ContentVideoExtension=function(){this.autoSourceRestore=this.respondPauseResume=!0;this._originalTime=0;this._contentVideoControls=this._contentVideoSrc=null;};a.ContentVideoExtension.prototype={_isEnabled:function(){var b=this._context.getParameter(a.PARAMETER_EXTENSION_CONTENT_VIDEO_ENABLED);return (null==b||!0===a.Util.str2bool(b))&&null!=this._context.getContentVideoElement()},_getBooleanParameter:function(b,c){b=this._context.getParameter(b);
  null==b&&(b=c);return a.Util.str2bool(b)},init:function(b){a.debug("ContentVideoExtension.init(context)");this._context=b;this._fixContentVideoCurrentTime=a.Util.bind(this,function(b){a.log("_fixContentVideoCurrentTime: event = "+b.type);if(!(0>=this._context.getContentVideoElement().currentTime||0>=this._context.getContentVideoElement().seekable.length)&&(this._context.getContentVideoElement().removeEventListener("timeupdate",this._fixContentVideoCurrentTime,!1),0<this._context.getContentVideoElement().currentTime&&
  1>this._context.getContentVideoElement().currentTime&&1<this._originalTime)){a.log("ContentVideoExtension: seeking to original time",this._originalTime);try{this._context.getContentVideoElement().currentTime=this._originalTime;}catch(d){a.warn("ContentVideoExtension: seek error");}}});this._pause=a.Util.bind(this,function(b){a.log("_pause: event = "+b.type);this._isEnabled()?this._respondPauseResume()&&(a.debug("ContentVideoExtension: EVENT_CONTENT_VIDEO_PAUSE_REQUEST pausing content video",this._context.getContentVideoElement().src),
  this._originalTime=this._context.getContentVideoElement().currentTime,this._context.getContentVideoElement().pause()):a.debug("ContentVideoExtension: extension is not enabled, do nothing.");});this._resume=a.Util.bind(this,function(b){a.log("_resume: event = "+b.type);this._isEnabled()?this._respondPauseResume()&&(a.debug("ContentVideoExtension: EVENT_CONTENT_VIDEO_RESUME_REQUEST resume content video",this._context.getContentVideoElement().src),!this._context._videoAsset||null!=this._context._videoAsset._state&&
  this._context._videoAsset._state!==a.VIDEO_STATE_COMPLETED?(a.log("ContentVideoExtension: resume content video"),this._context.getContentVideoElement().play(),a.PLATFORM_AUTO_SEEK_AFTER_MIDROLL&&!0===this._getBooleanParameter(a.PARAMETER_EXTENSION_CONTENT_VIDEO_AUTO_SEEK_BACK,!0)&&this._context.getContentVideoElement().addEventListener("timeupdate",this._fixContentVideoCurrentTime,!1)):a.warn("ContentVideoExtension: video state is uninitialized or completed, skip resume.")):a.debug("ContentVideoExtension: extension is not enabled, do nothing.");});
  this._onAttach=a.Util.bind(this,function(b){if(!this._isEnabled())a.debug("ContentVideoExtension: extension is not enabled, do nothing.");else if(this._autoSourceRestore())switch(b.slot.getTimePositionClass()){case a.TIME_POSITION_CLASS_PREROLL:case a.TIME_POSITION_CLASS_POSTROLL:a.debug("ContentVideoExtension: store current content video src",this._context.getContentVideoElement().src),this._contentVideoSrc=this._context.getContentVideoElement().src,this._contentVideoControls=this._context.getContentVideoElement().controls,
  this._context.getContentVideoElement().paused||this._context.getContentVideoElement().pause();}});this._onDetach=a.Util.bind(this,function(b){if(!this._isEnabled())a.debug("ContentVideoExtension: extension is not enabled, do nothing.");else if(this._autoSourceRestore())switch(b=b.slot.getTimePositionClass(),b){case a.TIME_POSITION_CLASS_PREROLL:case a.TIME_POSITION_CLASS_POSTROLL:a.debug("ContentVideoExtension: restore content video src to",this._contentVideoSrc),this._context.getContentVideoElement().src!==
  this._contentVideoSrc&&(this._context.getContentVideoElement().src=this._contentVideoSrc),this._context.getContentVideoElement().controls=this._contentVideoControls,b===a.TIME_POSITION_CLASS_PREROLL&&this._context.getContentVideoElement().load();}});a.debug("ContentVideoExtension: enabling content video pause resume request handling.");this._context.addEventListener(a.EVENT_CONTENT_VIDEO_PAUSE_REQUEST,this._pause);this._context.addEventListener(a.EVENT_CONTENT_VIDEO_RESUME_REQUEST,this._resume);a.debug("ContentVideoExtension: enabling content video source management.");
  this._context.addEventListener(a.EVENT_SLOT_STARTED,this._onAttach);this._context.addEventListener(a.EVENT_SLOT_ENDED,this._onDetach);},_respondPauseResume:function(){return this._getBooleanParameter(a.PARAMETER_EXTENSION_CONTENT_VIDEO_RESPOND_PAUSE_RESUME,!0)},_autoSourceRestore:function(){return this._getBooleanParameter(a.PARAMETER_EXTENSION_CONTENT_VIDEO_AUTO_SOURCE_RESTORE,!0)},dispose:function(){a.debug("ContentVideoExtension.dispose()");this._context&&(this._context.removeEventListener(a.EVENT_CONTENT_VIDEO_PAUSE_REQUEST,
  this._pause),this._context.removeEventListener(a.EVENT_CONTENT_VIDEO_RESUME_REQUEST,this._resume),this._context.removeEventListener(a.EVENT_SLOT_STARTED,this._onAttach),this._context.removeEventListener(a.EVENT_SLOT_ENDED,this._onDetach),this._context=null);}};a.ContentVideoExtension.prototype.constructor=a.ContentVideoExtension;return a};q.tv.freewheel.SDK||(q.tv.freewheel.SDK=q.tv.freewheel[l]("tv.freewheel.SDK"));return q})();

  class Player extends Lightning.Component  {

  	_firstActive() {
  		VideoPlayer.consumer(this);
  		//this.tag('MediaPlayer').updateSettings({consumer: this});
  		this.contentVideoSrc = 'https://vi.freewheel.tv/static/content/sample.mp4';
  		//this.contentVideoSrc = 'https://www.w3schools.com/html/mov_bbb.mp4';
  		this.isAdPlaying = false;
  		this.contentTime = 0;
  		this._duration = 0;
  		this._playheadTime = 0;
  		this.initAdManager();
  		this.requestAds();
  	}

  	initAdManager() {
  		tv.freewheel.SDK.setLogLevel(tv.freewheel.SDK.LOG_LEVEL_DEBUG);
  		this.adManager = new tv.freewheel.SDK.AdManager();
  		this.adManager.setNetwork(96749);
  		this.adManager.setServer("https://demo.v.fwmrm.net/ad/g/1");
  	}

  	requestAds() {
  		this.prerollSlots = [];
  		this.postrollSlots = [];
  		this.midrollSlots = [];
  		this.currentAdContext = this.adManager.newContext();

  		// Setting this parameter will cause AdManager to use XMLHTTRequests for the ad request and beacons
  		this.currentAdContext.setParameter(tv.freewheel.SDK.PARAMETER_ENABLE_JS_TRANSPORT, true, tv.freewheel.SDK.PARAMETER_LEVEL_GLOBAL);

  		// This profile was created for this demo
  		this.currentAdContext.setProfile("lightning-demo");

  		// Set the target.
  		this.currentAdContext.setVideoAsset("DemoVideoGroup.01", 500);
  		this.currentAdContext.setSiteSection("DemoSiteGroup.01");

  		// Optional if using custom key-value targeting: Add key-values in the ad request.
  		this.currentAdContext.addKeyValue("customTargetingKey", "LightningDemo");

  		// Add 1 preroll, 1 midroll, 1 postroll slot
  		this.currentAdContext.addTemporalSlot("Preroll_1", tv.freewheel.SDK.ADUNIT_PREROLL, 0);
  		this.currentAdContext.addTemporalSlot("Midroll_1", tv.freewheel.SDK.ADUNIT_MIDROLL, 30);
  		this.currentAdContext.addTemporalSlot("Postroll_1", tv.freewheel.SDK.ADUNIT_POSTROLL, 60);

  		// Listen to request_complete and slot_ended events.
  		this.currentAdContext.addEventListener(tv.freewheel.SDK.EVENT_REQUEST_COMPLETE, this.onRequestComplete.bind(this));
  		this.currentAdContext.addEventListener(tv.freewheel.SDK.EVENT_SLOT_ENDED, this.onSlotEnded.bind(this));

  		// This is a new method exposed for use with Lightning framework.
  		this.currentAdContext.registerCustomPlayer(this);

  		// This should be called for video rendition selection to properly select the correct video size
  		this.currentAdContext.setVideoDisplaySize(VideoPlayer.left, VideoPlayer.top, VideoPlayer.width, VideoPlayer.height);

  		this.currentAdContext.submitRequest();
  	}

  	onRequestComplete(evt) {
  		if (evt.success) {
  			this.adResponseLoaded = true;
  			// Temporal slots include preroll, midroll, postroll and overlay slots.
  			var temporalSlots = this.currentAdContext.getTemporalSlots();
  			for (var i = 0; i < temporalSlots.length; i++) {
  				var slot = temporalSlots[i];
  				switch (slot.getTimePositionClass()) {
  					case tv.freewheel.SDK.TIME_POSITION_CLASS_PREROLL:
  						this.prerollSlots.push(slot);
  						break;
  					case tv.freewheel.SDK.TIME_POSITION_CLASS_MIDROLL:
  						this.midrollSlots.push(slot);
  						break;
  					case tv.freewheel.SDK.TIME_POSITION_CLASS_POSTROLL:
  						this.postrollSlots.push(slot);
  						break;
  				}
  			}
  		}
  		this.playNextPreroll();
  	}

  	playNextPreroll() {
  		if (this.prerollSlots.length) {
  			var slot = this.prerollSlots.shift();
  			slot.play();
  		} else {
  			this.playContent();
  		}
  	}

  	playNextMidroll() {
  		if (this.midrollSlots.length) {
  			this.checkForMidroll();
  		} else {
  			this.playContent();
  		}
  	}

  	playNextPostroll() {
  		if (this.postrollSlots.length > 0) {
  			var slot = this.postrollSlots.shift();
  			slot.play();
  		} else {
  			if (this.currentAdContext) {
  				this.currentAdContext.removeEventListener(tv.freewheel.SDK.EVENT_REQUEST_COMPLETE, this.onRequestComplete);
  				this.currentAdContext.removeEventListener(tv.freewheel.SDK.EVENT_SLOT_ENDED, this.onSlotEnded);
  			}
  			this.currentAdContext = null;
  			this.adListener = null;
  			this.adManager = null;
  		}
  	}

  	playContent() {
  		if (this.currentAdContext){
  			this.currentAdContext.setVideoState(tv.freewheel.SDK.VIDEO_STATE_PLAYING);
  		}
  		VideoPlayer.open(this.contentVideoSrc);
  		if (this.contentTime > 0) {
  			VideoPlayer.seek(this.contentTime);
  		}
  	}

  	onSlotEnded(evt) {
  		var slotTimePositionClass = evt.slot.getTimePositionClass();
  		switch (slotTimePositionClass) {
  			case tv.freewheel.SDK.TIME_POSITION_CLASS_PREROLL:
  				this.playNextPreroll();
  				break;
  			case tv.freewheel.SDK.TIME_POSITION_CLASS_MIDROLL:
  				this.playNextMidroll();
  				break;
  			case tv.freewheel.SDK.TIME_POSITION_CLASS_POSTROLL:
  				this.playNextPostroll();
  				break;
  		}
  	}

  	checkForMidroll() {
  		for (var i = 0; i < this.midrollSlots.length; i++) {
  			var slot = this.midrollSlots[i];
  			var slotTimePosition = slot.getTimePosition();
  			if (Math.abs(this._playheadTime - slotTimePosition) < 0.2) {
  				this.midrollSlots.splice(i, 1);
  				if (this.currentAdContext){
  					this.currentAdContext.setVideoState(tv.freewheel.SDK.VIDEO_STATE_PAUSED);
  				}
  				slot.play();
  				return;
  			}
  		}
  	}

  	$videoPlayerTimeUpdate() {
  		this._playheadTime = VideoPlayer.currentTime;
  		this._duration = VideoPlayer.duration;
  		if (!this.isAdPlaying) {
  			this.contentTime = VideoPlayer.currentTime;
  			this.checkForMidroll();
  		}
  	}

  	$videoPlayerEnded() {
  		this._playheadTime = 0;
  		if (this.isAdPlaying) {
  			this.isAdPlaying = false;
  			this.adListener.onEnded();
  		} else {
  			this.currentAdContext.setVideoState(tv.freewheel.SDK.VIDEO_STATE_COMPLETED);
  			this.playNextPostroll();
  		}
  	}
   
  	$videoPlayerError(err) {
  		this._playheadTime = 0;
  		if (this.isAdPlaying) {
  			this.isAdPlaying = false;
  			this.adListener.onError("There was a player error: ", err);
  		} else {
  			this.currentAdContext.setVideoState(tv.freewheel.SDK.VIDEO_STATE_STOPPED);
  		}
  	}

  	$videoPlayerPlay() {
  		this._isPaused = false;
  	}

  	$videoPlayerPause() {
  		this._isPaused = true;
  	}

  	// the methods below implement the CustomPlayer API
  	open(url, adListener) {
  		this.adListener = adListener;
  		this.isAdPlaying = true;
  		VideoPlayer.open(url);
  	}

  	playPause(isPause) {
  		if (isPause) {
  			VideoPlayer.pause();
  		} else {
  			VideoPlayer.play();
  		}
  	}

  	getDuration() {
  		return this._duration;
  	}

  	getPlayheadTime() {
  		return this._playheadTime;
  	}
  }

  class App extends Lightning.Component {
  	static getFonts() {
  		return [{ family: 'Regular', url: Utils.asset('fonts/Roboto-Regular.ttf') }]
  	}

  	static _template() {
  		return {
  			Player: {
  				type: Player
  			}
  		}
  	}

  	_init() {
  		Utils.proxyUrl("http://192.168.1.159:8888");
  		this._setState("Playing");
  	}

  	static _states() {
  		return [
  			class Playing extends this {
  				_getFocused() {
  					return this.tag("Player")
  				}
  			}
  		]
  	}
  }

  function index() {
  	return Launch(App, ...arguments)
  }

  return index;

}());
//# sourceMappingURL=appBundle.js.map
