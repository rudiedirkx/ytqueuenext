const CHANNEL_OUT = new BroadcastChannel('youtubequeue');

var EARLY_NEXT = [];

var currentChannel = null;

function getVid(uri) {
	return (uri.match(/[&?]v=([^&]+)/) || '')[1];
}

function getCurrentVid() {
	return getVid(document.location.href) || null;
}

function getCurrentChannel() {
	var m = document.location.pathname.match(/\/channel\/([^\/]+)/);
	if ( m ) {
		return m[1];
	}

	var $owner = document.querySelector('#owner-container a');
	if ( $owner ) {
		m = $owner.href.match(/channel\/([^/]+)/);
		if ( m ) {
			return m[1];
		}
	}

	return null;
}

function getCurrentChannelName() {
	var $owner = document.querySelector('#owner-container a');
	if ( $owner ) {
		return $owner.textContent.trim();
	}

	$owner = document.querySelector('#channel-title-container #channel-title');
	if ( $owner ) {
		return $owner.textContent.trim();
	}
}

function evalCurrentChannel() {
	const newCurChannel = getCurrentChannel();
	// console.log('[YTQN] channel ', currentChannel, 'vs', newCurChannel);
	if ( currentChannel != newCurChannel ) {
		console.log('[YTQN] NEW CHANNEL: ' + newCurChannel + ' (was ' + currentChannel + ')');

		buildChannelTimerWidget();

		currentChannel = newCurChannel;
	}
}

function loadChannelNexts() {
	chrome.storage.sync.get('channels', function(items) {
		EARLY_NEXT = items.channels || [];
		console.log('EARLY_NEXT', EARLY_NEXT);
	});
}

function saveChannelNext(enabled, delay) {
	console.log()
	chrome.storage.sync.get('channels', function(items) {
		var channels = items.channels || [];

		// Remove this channel
		channels = channels.filter((channel) => {
			return channel.channel != getCurrentChannel();
		});

		// Add this channel
		if ( enabled ) {
			const name = getCurrentChannelName();
			channels.push({
				channel: getCurrentChannel(),
				delay,
				name,
			});
		}
		chrome.storage.sync.set({channels}, loadChannelNexts);
	});
}

function hasChannelNext( channel ) {
	return (EARLY_NEXT.find((obj) => obj.channel == channel) || {delay: null}).delay;
}

function buildChannelTimerWidget() {
	const $subBtn = document.querySelector('#meta-contents #subscribe-button, #channel-header-container #subscribe-button');
	if ( !$subBtn ) return;

	var $container = document.querySelector('.yt-queue-next-channel-widget');
	$container && $container.remove();

	$container = document.createElement('div');
	$container.className = 'yt-queue-next-channel-widget';
	$container.innerHTML = `
		<input class="enabled" id="ytqn-enabled" type="checkbox" />
		<label class="enabled" for="ytqn-enabled">NEXT</label>
		<label class="delay">DELAY: <input type="number" min="0" /></label>
	`;

	const $enabled = $container.querySelector('input.enabled');
	const $delay = $container.querySelector('.delay input');

	const save = () => saveChannelNext($enabled.checked, parseFloat($delay.value));

	const delay = hasChannelNext(getCurrentChannel());
	$enabled.checked = delay != null;
	$delay.value = delay != null ? delay : 0;

	$enabled.addEventListener('change', function(e) {
		save();
		this.checked && $delay.focus();
	});

	$delay.addEventListener('input', function(e) {
		save();
	});

	$subBtn.parentNode.insertBefore($container, $subBtn);
}

function channelTooltipIsVisible() {
	var ce = document.querySelector('.ytp-ce-element.ytp-ce-channel');
	return ce && ce.offsetHeight > 0 && parseFloat(getComputedStyle(ce).opacity) > 0;
}

// === //

setTimeout(loadChannelNexts);

setInterval(evalCurrentChannel, 200);

document.addEventListener('timeupdate', function(e) {
	var $video = e.target;

	if ( $video.currentTime > $video.duration - 20 ) {
		if ( channelTooltipIsVisible() ) {
			console.log('[YTQN] timeupdate early? channel', currentChannel);
			if ( hasChannelNext(currentChannel) != null ) {
				console.log('[YTQN] timeupdate early!');
				CHANNEL_OUT.postMessage({command: 'next', from: getCurrentVid()});
			}
		}
	}
}, true);
