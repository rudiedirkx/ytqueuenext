const $tbody = document.querySelector('tbody#channels');

chrome.storage.sync.get(['channels'], function(items) {
	const channels = items.channels || [];
	var html = '';
	channels.forEach(function(item) {
		html += '<tr>';
		html += `<td><a href="https://www.youtube.com/channel/${item.channel}">${item.channel}</a></td>`;
		html += `<td>${item.name}</td>`;
		html += `<td>${item.delay}s</td>`;
		html += '</tr>';
	});
	$tbody.innerHTML = html;
});
