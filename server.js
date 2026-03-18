const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// ============== 游戏数据 ==============

const ROLES = {
  townsfolk: [
    { id: 'washerwoman', name: '洗衣妇', team: 'good', type: 'townsfolk', nightOrder: 32, firstNight: true, otherNight: false, desc: '你会得知两名玩家中的一名是某个特定的镇民' },
    { id: 'librarian', name: '图书管理员', team: 'good', type: 'townsfolk', nightOrder: 33, firstNight: true, otherNight: false, desc: '你会得知两名玩家中的一名是某个特定的外来者（或没有外来者在场）' },
    { id: 'investigator', name: '调查员', team: 'good', type: 'townsfolk', nightOrder: 34, firstNight: true, otherNight: false, desc: '你会得知两名玩家中的一名是某个特定的爪牙' },
    { id: 'chef', name: '厨师', team: 'good', type: 'townsfolk', nightOrder: 36, firstNight: true, otherNight: false, desc: '你会得知有多少对邪恶玩家相邻而坐' },
    { id: 'empath', name: '共情者', team: 'good', type: 'townsfolk', nightOrder: 37, firstNight: true, otherNight: true, desc: '每个夜晚，你会得知与你相邻的存活玩家中有多少个是邪恶的' },
    { id: 'fortuneteller', name: '占卜师', team: 'good', type: 'townsfolk', nightOrder: 38, firstNight: true, otherNight: true, desc: '每个夜晚，你选择两名玩家，得知其中是否有恶魔（有一名玩家你会误认为恶魔）' },
    { id: 'monk', name: '僧侣', team: 'good', type: 'townsfolk', nightOrder: 12, firstNight: false, otherNight: true, desc: '每个夜晚（除第一夜），你选择一名玩家（非你自己），该玩家今晚不会被恶魔杀死' },
    { id: 'undertaker', name: '掘墓人', team: 'good', type: 'townsfolk', nightOrder: 40, firstNight: false, otherNight: true, desc: '每个夜晚（有人被处决后），你会得知今天白天被处决的玩家的角色' },
    { id: 'virgin', name: '处女', team: 'good', type: 'townsfolk', nightOrder: 0, firstNight: false, otherNight: false, desc: '第一次被提名时，如果提名你的是镇民，该镇民被立即处决' },
    { id: 'slayer', name: '杀手', team: 'good', type: 'townsfolk', nightOrder: 0, firstNight: false, otherNight: false, desc: '游戏中一次，在白天你可以公开选择一名玩家：如果该玩家是恶魔，则该玩家死亡' },
    { id: 'soldier', name: '士兵', team: 'good', type: 'townsfolk', nightOrder: 0, firstNight: false, otherNight: false, desc: '你不会被恶魔杀死' },
    { id: 'mayor', name: '市长', team: 'good', type: 'townsfolk', nightOrder: 0, firstNight: false, otherNight: false, desc: '如果只剩3名玩家存活且当天无人被处决，善良阵营获胜' },
    { id: 'ravenkeeper', name: '守鸦人', team: 'good', type: 'townsfolk', nightOrder: 41, firstNight: false, otherNight: true, desc: '如果你在夜晚死亡，你可以选择一名玩家，得知该玩家的角色' },
  ],
  outsider: [
    { id: 'butler', name: '管家', team: 'good', type: 'outsider', nightOrder: 39, firstNight: true, otherNight: true, desc: '每个夜晚，你选择一名玩家（非你自己），只有当该玩家投票时你才能投票' },
    { id: 'drunk', name: '酒鬼', team: 'good', type: 'outsider', nightOrder: 0, firstNight: false, otherNight: false, desc: '你以为你是一个镇民，但实际上你不是。你的能力无效' },
    { id: 'recluse', name: '隐士', team: 'good', type: 'outsider', nightOrder: 0, firstNight: false, otherNight: false, desc: '你可能被"探测"为邪恶角色，即使你是善良的' },
    { id: 'saint', name: '圣徒', team: 'good', type: 'outsider', nightOrder: 0, firstNight: false, otherNight: false, desc: '如果你被处决，邪恶阵营获胜' },
  ],
  minion: [
    { id: 'poisoner', name: '下毒者', team: 'evil', type: 'minion', nightOrder: 17, firstNight: true, otherNight: true, desc: '每个夜晚，你选择一名玩家：该玩家今晚和明天白天中毒（能力无效）' },
    { id: 'spy', name: '间谍', team: 'evil', type: 'minion', nightOrder: 48, firstNight: true, otherNight: true, desc: '每个夜晚，你可以查看魔典。你可能被"探测"为善良角色' },
    { id: 'baron', name: '男爵', team: 'evil', type: 'minion', nightOrder: 0, firstNight: false, otherNight: false, desc: '场上会多出两名外来者' },
    { id: 'scarletwoman', name: '猩红女郎', team: 'evil', type: 'minion', nightOrder: 0, firstNight: false, otherNight: false, desc: '如果恶魔死亡且存活玩家≥5人，你变成恶魔' },
  ],
  demon: [
    { id: 'imp', name: '小鬼', team: 'evil', type: 'demon', nightOrder: 24, firstNight: false, otherNight: true, desc: '每个夜晚（除第一夜），你选择一名玩家：该玩家死亡。如果你自杀，一名活着的爪牙变成小鬼' },
  ],
};

const ALL_ROLES = [...ROLES.townsfolk, ...ROLES.outsider, ...ROLES.minion, ...ROLES.demon];

// 人数配置
const PLAYER_CONFIG = {
  5:  { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6:  { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7:  { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8:  { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9:  { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
};

// ============== 房间管理 ==============

const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.has(code));
  return code;
}

function createRoom(storytellerSocket, storytellerName) {
  const code = generateRoomCode();
  const room = {
    code,
    storyteller: { socketId: storytellerSocket.id, name: storytellerName },
    players: [],
    phase: 'lobby', // lobby, night, day, vote, ended
    nightNum: 0,
    dayNum: 0,
    selectedRoles: [],
    assignments: {},  // socketId -> role
    alive: {},        // socketId -> boolean
    ghostVotes: {},   // socketId -> boolean (has used ghost vote)
    messages: [],
    nominations: [],
    currentNomination: null,
    votes: {},
    executedToday: null,
    nightActions: {},
    nightInfo: {},    // storyteller's info to send to players
    wokenPlayer: null,
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code);
}

function getPlayerName(room, socketId) {
  if (room.storyteller.socketId === socketId) return room.storyteller.name;
  const p = room.players.find(p => p.socketId === socketId);
  return p ? p.name : '未知';
}

function getAliveCount(room) {
  return room.players.filter(p => room.alive[p.socketId]).length;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============== Socket.IO ==============

io.on('connection', (socket) => {
  let currentRoom = null;

  // 创建房间
  socket.on('createRoom', (name) => {
    const room = createRoom(socket, name);
    currentRoom = room.code;
    socket.join(room.code);
    socket.emit('roomCreated', { code: room.code, isStoryteller: true });
    console.log(`Room ${room.code} created by ${name}`);
  });

  // 加入房间
  socket.on('joinRoom', ({ code, name }) => {
    const room = getRoom(code);
    if (!room) return socket.emit('error', '房间不存在');
    if (room.phase !== 'lobby') return socket.emit('error', '游戏已开始，无法加入');
    if (room.players.length >= 12) return socket.emit('error', '房间已满');
    if (room.players.some(p => p.name === name)) return socket.emit('error', '昵称已被使用');

    room.players.push({ socketId: socket.id, name });
    currentRoom = code;
    socket.join(code);
    socket.emit('roomJoined', { code, isStoryteller: false, playerName: name });
    io.to(code).emit('playerList', {
      players: room.players.map(p => ({ name: p.name, id: p.socketId })),
      storyteller: room.storyteller.name
    });
    console.log(`${name} joined room ${code}`);
  });

  // 说书人选择角色
  socket.on('selectRoles', ({ roles }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    room.selectedRoles = roles;
    socket.emit('rolesSelected', roles);
  });

  // 自动推荐角色
  socket.on('autoSelectRoles', () => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    const count = room.players.length;
    const config = PLAYER_CONFIG[count];
    if (!config) return socket.emit('error', `不支持${count}人游戏，需要5-12人`);

    const selected = [];
    selected.push(...shuffle(ROLES.townsfolk).slice(0, config.townsfolk).map(r => r.id));
    selected.push(...shuffle(ROLES.outsider).slice(0, config.outsider).map(r => r.id));
    selected.push(...shuffle(ROLES.minion).slice(0, config.minion).map(r => r.id));
    selected.push(...shuffle(ROLES.demon).slice(0, config.demon).map(r => r.id));

    room.selectedRoles = selected;
    socket.emit('rolesSelected', selected);
  });

  // 分配角色并开始游戏
  socket.on('startGame', () => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    if (room.players.length < 5) return socket.emit('error', '至少需要5名玩家');
    if (room.selectedRoles.length !== room.players.length) {
      return socket.emit('error', `需要选择${room.players.length}个角色，当前选了${room.selectedRoles.length}个`);
    }

    // 随机分配角色
    const shuffledRoles = shuffle(room.selectedRoles);
    room.players.forEach((p, i) => {
      room.assignments[p.socketId] = shuffledRoles[i];
      room.alive[p.socketId] = true;
      room.ghostVotes[p.socketId] = false;
    });

    room.phase = 'night';
    room.nightNum = 1;

    // 通知每个玩家自己的角色
    room.players.forEach(p => {
      const roleId = room.assignments[p.socketId];
      const role = ALL_ROLES.find(r => r.id === roleId);
      io.to(p.socketId).emit('gameStarted', { role, phase: 'night', nightNum: 1 });
    });

    // 通知说书人（带所有角色信息）
    const grimoire = room.players.map(p => ({
      name: p.name,
      socketId: p.socketId,
      role: ALL_ROLES.find(r => r.id === room.assignments[p.socketId]),
      alive: true,
    }));
    socket.emit('gameStarted', { grimoire, phase: 'night', nightNum: 1, isStoryteller: true });

    // 通知邪恶阵营互相认识
    const evilPlayers = room.players.filter(p => {
      const role = ALL_ROLES.find(r => r.id === room.assignments[p.socketId]);
      return role && role.team === 'evil';
    });
    const demon = evilPlayers.find(p => {
      const role = ALL_ROLES.find(r => r.id === room.assignments[p.socketId]);
      return role && role.type === 'demon';
    });
    // 爪牙知道恶魔是谁
    evilPlayers.forEach(p => {
      const role = ALL_ROLES.find(r => r.id === room.assignments[p.socketId]);
      if (role.type === 'minion') {
        const evilInfo = evilPlayers.map(ep => ({
          name: ep.name,
          role: ALL_ROLES.find(r => r.id === room.assignments[ep.socketId]).name,
        }));
        io.to(p.socketId).emit('evilReveal', { evilPlayers: evilInfo });
      }
    });
    // 恶魔知道爪牙和三个不在场的善良角色
    if (demon) {
      const evilInfo = evilPlayers.map(ep => ({
        name: ep.name,
        role: ALL_ROLES.find(r => r.id === room.assignments[ep.socketId]).name,
      }));
      const usedGoodRoles = room.selectedRoles.filter(rid => {
        const r = ALL_ROLES.find(x => x.id === rid);
        return r && r.team === 'good';
      });
      const unusedGoodRoles = [...ROLES.townsfolk, ...ROLES.outsider]
        .filter(r => !usedGoodRoles.includes(r.id))
        .map(r => r.name);
      const bluffs = shuffle(unusedGoodRoles).slice(0, 3);
      io.to(demon.socketId).emit('evilReveal', { evilPlayers: evilInfo, bluffs });
    }

    io.to(currentRoom).emit('phaseChange', { phase: 'night', nightNum: 1 });
    console.log(`Game started in room ${currentRoom}`);
  });

  // 说书人唤醒玩家（夜间）
  socket.on('wakePlayer', ({ targetId }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    room.wokenPlayer = targetId;
    const role = ALL_ROLES.find(r => r.id === room.assignments[targetId]);
    io.to(targetId).emit('woken', { role });
  });

  // 玩家提交夜间行动
  socket.on('nightAction', ({ action, targets }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    room.nightActions[socket.id] = { action, targets };
    // 通知说书人
    io.to(room.storyteller.socketId).emit('nightActionReceived', {
      playerName: getPlayerName(room, socket.id),
      playerId: socket.id,
      role: room.assignments[socket.id],
      action,
      targets: targets.map(t => getPlayerName(room, t)),
      targetIds: targets,
    });
  });

  // 说书人向玩家发送夜间信息
  socket.on('sendNightInfo', ({ targetId, info }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    io.to(targetId).emit('nightInfo', { info });
  });

  // 说书人让玩家睡去
  socket.on('sleepPlayer', ({ targetId }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    room.wokenPlayer = null;
    io.to(targetId).emit('slept');
  });

  // 说书人结束夜晚
  socket.on('endNight', ({ deaths }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;

    // 处理死亡
    if (deaths && deaths.length > 0) {
      deaths.forEach(d => {
        room.alive[d] = false;
      });
    }

    room.phase = 'day';
    room.dayNum = room.nightNum;
    room.nightActions = {};
    room.executedToday = null;
    room.nominations = [];
    room.currentNomination = null;
    room.votes = {};

    const deathNames = (deaths || []).map(d => getPlayerName(room, d));
    const aliveList = room.players.map(p => ({
      name: p.name,
      socketId: p.socketId,
      alive: room.alive[p.socketId],
    }));

    io.to(currentRoom).emit('phaseChange', {
      phase: 'day',
      dayNum: room.dayNum,
      deaths: deathNames,
      alivePlayers: aliveList,
    });

    // 检查胜负
    checkWinCondition(room);
  });

  // 公共聊天
  socket.on('chatMessage', ({ message }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    const name = getPlayerName(room, socket.id);
    const isStoryteller = room.storyteller.socketId === socket.id;
    io.to(currentRoom).emit('chatMessage', {
      from: name,
      message,
      isStoryteller,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });
  });

  // 私聊
  socket.on('privateMessage', ({ targetId, message }) => {
    const room = getRoom(currentRoom);
    if (!room) return;
    const fromName = getPlayerName(room, socket.id);
    const toName = getPlayerName(room, targetId);
    const msg = {
      from: fromName,
      fromId: socket.id,
      to: toName,
      toId: targetId,
      message,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };
    io.to(targetId).emit('privateMessage', msg);
    socket.emit('privateMessage', msg);
    // 说书人也能看到所有私聊
    if (socket.id !== room.storyteller.socketId && targetId !== room.storyteller.socketId) {
      io.to(room.storyteller.socketId).emit('privateMessageSpy', msg);
    }
  });

  // 提名
  socket.on('nominate', ({ targetId }) => {
    const room = getRoom(currentRoom);
    if (!room || room.phase !== 'day') return;
    if (!room.alive[socket.id] && socket.id !== room.storyteller.socketId) return;
    if (!room.alive[targetId]) return;
    if (room.currentNomination) return socket.emit('error', '当前有正在进行的投票');

    const nominatorName = getPlayerName(room, socket.id);
    const targetName = getPlayerName(room, targetId);

    room.currentNomination = {
      nominator: socket.id,
      nominatorName,
      target: targetId,
      targetName,
    };
    room.votes = {};

    io.to(currentRoom).emit('nominationStarted', {
      nominator: nominatorName,
      target: targetName,
      targetId,
      aliveCount: getAliveCount(room),
    });
  });

  // 投票
  socket.on('vote', ({ vote }) => {
    const room = getRoom(currentRoom);
    if (!room || !room.currentNomination) return;

    // 死人只能用一次幽灵投票
    if (!room.alive[socket.id]) {
      if (room.ghostVotes[socket.id]) return socket.emit('error', '你已经用过幽灵投票了');
      if (vote) room.ghostVotes[socket.id] = true;
    }

    room.votes[socket.id] = vote;

    // 通知说书人投票进度
    io.to(room.storyteller.socketId).emit('voteProgress', {
      player: getPlayerName(room, socket.id),
      vote,
      totalVotes: Object.keys(room.votes).length,
      neededVotes: room.players.length,
    });

    // 检查是否所有人都投了
    const eligibleVoters = room.players.filter(p =>
      room.alive[p.socketId] || !room.ghostVotes[p.socketId]
    );
    // 说书人可以手动结束投票，或者自动：
    // 这里我们等说书人手动结束
  });

  // 说书人结束投票
  socket.on('endVote', () => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id || !room.currentNomination) return;

    const yesVotes = Object.values(room.votes).filter(v => v).length;
    const threshold = Math.ceil(getAliveCount(room) / 2);
    const passed = yesVotes >= threshold;

    const result = {
      target: room.currentNomination.targetName,
      targetId: room.currentNomination.target,
      yesVotes,
      threshold,
      passed,
      voters: Object.entries(room.votes).map(([sid, v]) => ({
        name: getPlayerName(room, sid),
        vote: v
      })),
    };

    if (passed) {
      room.executedToday = room.currentNomination.target;
    }

    room.nominations.push(result);
    room.currentNomination = null;
    room.votes = {};

    io.to(currentRoom).emit('voteResult', result);
  });

  // 说书人执行处决
  socket.on('execute', () => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    if (!room.executedToday) return;

    const targetId = room.executedToday;
    room.alive[targetId] = false;
    const targetName = getPlayerName(room, targetId);
    const role = ALL_ROLES.find(r => r.id === room.assignments[targetId]);

    io.to(currentRoom).emit('playerExecuted', {
      name: targetName,
      alivePlayers: room.players.map(p => ({
        name: p.name,
        socketId: p.socketId,
        alive: room.alive[p.socketId],
      })),
    });

    // 通知说书人角色（说书人已经知道）
    // 检查圣徒被处决 → 邪恶胜利
    if (role && role.id === 'saint') {
      io.to(currentRoom).emit('gameOver', {
        winner: 'evil',
        reason: '圣徒被处决了！邪恶阵营获胜！',
      });
      room.phase = 'ended';
      return;
    }

    // 检查恶魔被处决 → 善良胜利（除非猩红女郎接替）
    if (role && role.type === 'demon') {
      const scarlet = room.players.find(p =>
        room.alive[p.socketId] && room.assignments[p.socketId] === 'scarletwoman'
      );
      if (scarlet && getAliveCount(room) >= 5) {
        room.assignments[scarlet.socketId] = 'imp';
        io.to(scarlet.socketId).emit('becameDemon');
        io.to(room.storyteller.socketId).emit('demonChanged', {
          newDemon: scarlet.name,
        });
      } else {
        io.to(currentRoom).emit('gameOver', {
          winner: 'good',
          reason: '恶魔被处决了！善良阵营获胜！',
        });
        room.phase = 'ended';
        return;
      }
    }

    checkWinCondition(room);
  });

  // 说书人开始夜晚
  socket.on('startNight', () => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;

    room.nightNum++;
    room.phase = 'night';
    room.nightActions = {};
    room.executedToday = null;

    io.to(currentRoom).emit('phaseChange', { phase: 'night', nightNum: room.nightNum });
  });

  // 说书人杀死玩家（手动）
  socket.on('killPlayer', ({ targetId }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    room.alive[targetId] = false;
    io.to(currentRoom).emit('playerDied', {
      name: getPlayerName(room, targetId),
      alivePlayers: room.players.map(p => ({
        name: p.name,
        socketId: p.socketId,
        alive: room.alive[p.socketId],
      })),
    });
    checkWinCondition(room);
  });

  // 说书人复活玩家
  socket.on('revivePlayer', ({ targetId }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    room.alive[targetId] = true;
    io.to(currentRoom).emit('playerRevived', {
      name: getPlayerName(room, targetId),
      alivePlayers: room.players.map(p => ({
        name: p.name,
        socketId: p.socketId,
        alive: room.alive[p.socketId],
      })),
    });
  });

  // 杀手技能（白天）
  socket.on('slayerShot', ({ targetId }) => {
    const room = getRoom(currentRoom);
    if (!room || room.phase !== 'day') return;
    const role = ALL_ROLES.find(r => r.id === room.assignments[socket.id]);
    if (!role || role.id !== 'slayer') return;

    const targetRole = ALL_ROLES.find(r => r.id === room.assignments[targetId]);
    const shooterName = getPlayerName(room, socket.id);
    const targetName = getPlayerName(room, targetId);

    io.to(currentRoom).emit('slayerUsed', { shooter: shooterName, target: targetName });

    // 通知说书人，由说书人决定结果
    io.to(room.storyteller.socketId).emit('slayerShotPending', {
      shooter: shooterName,
      shooterId: socket.id,
      target: targetName,
      targetId,
      targetIsDemo: targetRole && targetRole.type === 'demon',
    });
  });

  // 说书人确认杀手结果
  socket.on('confirmSlayerShot', ({ targetId, success }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    if (success) {
      room.alive[targetId] = false;
      io.to(currentRoom).emit('slayerKill', {
        target: getPlayerName(room, targetId),
        alivePlayers: room.players.map(p => ({
          name: p.name,
          socketId: p.socketId,
          alive: room.alive[p.socketId],
        })),
      });
      checkWinCondition(room);
    } else {
      io.to(currentRoom).emit('slayerMiss', { target: getPlayerName(room, targetId) });
    }
  });

  // 说书人手动结束游戏
  socket.on('endGame', ({ winner, reason }) => {
    const room = getRoom(currentRoom);
    if (!room || room.storyteller.socketId !== socket.id) return;
    room.phase = 'ended';
    io.to(currentRoom).emit('gameOver', { winner, reason });
  });

  // 断线处理
  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (!room) return;

    const name = getPlayerName(room, socket.id);
    if (room.storyteller.socketId === socket.id) {
      io.to(currentRoom).emit('storytellerLeft');
    } else {
      io.to(currentRoom).emit('playerDisconnected', { name });
    }
    console.log(`${name} disconnected from room ${currentRoom}`);
  });
});

function checkWinCondition(room) {
  const aliveCount = getAliveCount(room);
  const aliveDemon = room.players.find(p => {
    const role = ALL_ROLES.find(r => r.id === room.assignments[p.socketId]);
    return room.alive[p.socketId] && role && role.type === 'demon';
  });

  if (!aliveDemon) {
    io.to(room.code).emit('gameOver', {
      winner: 'good',
      reason: '恶魔已死亡！善良阵营获胜！',
    });
    room.phase = 'ended';
    return;
  }

  if (aliveCount <= 2) {
    io.to(room.code).emit('gameOver', {
      winner: 'evil',
      reason: '仅剩2名玩家存活，邪恶阵营获胜！',
    });
    room.phase = 'ended';
    return;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`血染钟楼服务器运行在端口 ${PORT}`);
});
