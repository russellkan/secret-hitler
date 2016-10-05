const {sendInProgressGameUpdate} = require('../util.js'),
	{games} = require('../models.js'),
	_ = require('lodash');

module.exports.startElection = game => {
	const {seatedPlayers} = game.private,
		{presidentIndex, previousElectedGovernment} = game.gameState,
		pendingPresidentPlayer = game.private.seatedPlayers[presidentIndex];

	game.general.electionCount++;
	game.general.status = `Election #${game.general.electionCount} begins`;
	pendingPresidentPlayer.gameChats.push({
		gameChat: true,
		chat: [{
			text: 'You are president and must select a chancellor.'
		}]
	});

	pendingPresidentPlayer.playersState.filter((player, index) => index).forEach(player => {
		player.notificationStatus = 'notification';
	});

	game.publicPlayersState[presidentIndex].governmentStatus = 'isPendingPresident';
	game.publicPlayersState[presidentIndex].isLoader = true;
	game.gameState.phase = 'selectingChancellor';
	game.gameState.clickActionInfo = [pendingPresidentPlayer.userName, _.without(_.range(0, seatedPlayers.length), presidentIndex, ...previousElectedGovernment)];
	sendInProgressGameUpdate(game);
};

module.exports.selectChancellor = data => {
	const game = games.find(el => el.general.uid === data.uid),
		{chancellorIndex} = data,
		presidentIndex = game.publicPlayersState.findIndex(player => player.governmentStatus === 'isPendingPresident'),
		{seatedPlayers} = game.private,
		presidentPlayer = game.private.seatedPlayers[presidentIndex],
		chancellorPlayer = game.private.seatedPlayers[chancellorIndex];

	game.publicPlayersState[presidentIndex].isLoader = false;

	presidentPlayer.playersState.forEach(player => {
		player.notificationStatus = '';
	});

	game.publicPlayersState[chancellorIndex].governmentStatus = 'isPendingChancellor';
	game.general.status = `Vote on election #${game.general.electionCount} now.`;

	game.publicPlayersState.forEach(player => {
		player.isLoader = true;
		player.cardStatus = {
			cardDisplayed: true,
			isFlipped: false,
			cardFront: 'ballot',
			cardBack: {}
		};
	});

	sendInProgressGameUpdate(game);

	seatedPlayers.forEach(player => {
		player.gameChats.push({
			gameChat: true,
			chat: [{
				text: 'You must vote for the election of president '
			},
			{
				text: presidentPlayer.userName,
				type: 'player'
			},
			{
				text: ' and chancellor '
			},
			{
				text: chancellorPlayer.userName,
				type: 'player'
			},
			{
				text: '.'
			}]
		});

		player.cardFlingerState = [
			{
				position: 'middle-left',
				notificationStatus: '',
				action: 'active',
				cardStatus: {
					isFlipped: false,
					cardFront: 'ballot',
					cardBack: 'ja'
				}
			},
			{
				position: 'middle-right',
				action: 'active',
				notificationStatus: '',
				cardStatus: {
					isFlipped: false,
					cardFront: 'ballot',
					cardBack: 'nein'
				}
			}
		];
	});

	game.trackState.blurred = true;

	setTimeout(() => {
		sendInProgressGameUpdate(game);
	}, 2000);

	setTimeout(() => {
		seatedPlayers.forEach(player => {
			player.cardFlingerState[0].cardStatus.isFlipped = true;
			player.cardFlingerState[0].notificationStatus = 'notify';
			player.cardFlingerState[1].cardStatus.isFlipped = true;
			player.cardFlingerState[1].notificationStatus = 'notify';
		});
		sendInProgressGameUpdate(game);
	}, 5000);
};