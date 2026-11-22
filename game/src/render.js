// Canvas renderer: floor, walls, lamps, vision cones, shadow overlay, actors, HUD bars.
import { TILE, VIEW_W, VIEW_H, COLORS, GUARD, CAMERA } from './config.js';
export function render(ctx, world, game, time) {
  const { player, guards, noises, lureMarks } = game;
  ctx.save();
  ctx.fillStyle = COLORS.floorDark;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const mapW = world.w * TILE, mapH = world.h * TILE;
  const camX = Math.max(VIEW_W / 2, Math.min(player.x, mapW - VIEW_W / 2));
  const camY = Math.max(VIEW_H / 2, Math.min(player.y, mapH - VIEW_H / 2));
  ctx.translate(VIEW_W / 2 - camX + Math.max(0, (mapW - VIEW_W) / 2) * 0, VIEW_H / 2 - camY);
  drawFloor(ctx, world);
  drawLampPools(ctx, world, time);
  drawExit(ctx, world, time);
  drawWalls(ctx, world);
  drawShadow(ctx, world, player, time);
  drawLures(ctx, noises ?? [], lureMarks ?? []);
  drawCones(ctx, world, guards);
  drawCameras(ctx, world, game);
  drawLoot(ctx, world, player);
  drawGuards(ctx, guards);
  drawPlayer(ctx, player, world);
  ctx.restore();
  drawHud(ctx, game);
}
function drawFloor(ctx, world) {
  ctx.fillStyle = COLORS.floorLit;
  for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
    if (!world.walls.has(x + ',' + y)) ctx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
  }
}
function drawWalls(ctx, world) {
  for (const key of world.walls) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = COLORS.wall; ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop; ctx.fillRect(x * TILE, y * TILE, TILE, 6);
  }
}
function drawLampPools(ctx, world, time) {
  for (const lamp of world.lamps) {
    const flick = 1 + Math.sin(time * 0.006 + lamp.x) * 0.12;
    const r = 150 * flick;
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, r);
    grad.addColorStop(0, 'rgba(255,236,170,0.30)');
    grad.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2); ctx.fill();
  }
}
function drawExit(ctx, world, time) {
  const pulse = 6 + Math.sin(time * 0.004) * 4;
  ctx.strokeStyle = COLORS.exit; ctx.lineWidth = 3;
  ctx.strokeRect(world.exit.x - 16 - pulse / 2, world.exit.y - 16 - pulse / 2, 32 + pulse, 32 + pulse);
  ctx.fillStyle = 'rgba(99,230,160,0.25)';
  ctx.fillRect(world.exit.x - 16, world.exit.y - 16, 32, 32);
}
function drawCameras(ctx, world, game) {
  const alert = game.alarm > 0.5;
  for (const cam of world.cameras) {
    const half = (CAMERA.fov * Math.PI / 180) / 2, steps = 12, pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = cam.face - half + (2 * half * i) / steps;
      let d = CAMERA.range;
      for (let s = 20; s < CAMERA.range; s += 14) {
        const px = cam.x + Math.cos(a) * s, py = cam.y + Math.sin(a) * s;
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
        if (world.walls.has(tx + ',' + ty)) { d = s; break; }
      }
      pts.push([cam.x + Math.cos(a) * d, cam.y + Math.sin(a) * d]);
    }
    ctx.fillStyle = alert ? 'rgba(255,82,56,0.14)' : 'rgba(103,212,224,0.12)';
    ctx.beginPath(); ctx.moveTo(cam.x, cam.y);
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = alert ? COLORS.cameraAlert : COLORS.camera; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cam.x, cam.y);
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#20262e'; ctx.fillRect(cam.x - 2, cam.y - 14, 4, 12);
    ctx.fillStyle = '#2a3038'; ctx.fillRect(cam.x - 9, cam.y - 6, 18, 12);
    ctx.fillStyle = alert ? '#ff5238' : '#67d4e0';
    ctx.beginPath(); ctx.arc(cam.x + Math.cos(cam.face) * 8, cam.y + Math.sin(cam.face) * 8, 4, 0, Math.PI * 2); ctx.fill();
  }
}
function drawLoot(ctx, world, player) {
  if (!world.loot || player.hasLoot) return;
  const t = performance.now() * 0.003;
  const grad = ctx.createRadialGradient(world.loot.x, world.loot.y, 2, world.loot.x, world.loot.y, 46);
  grad.addColorStop(0, 'rgba(255,214,92,0.55)');
  grad.addColorStop(1, 'rgba(255,214,92,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(world.loot.x, world.loot.y, 46 + Math.sin(t) * 4, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(world.loot.x, world.loot.y);
  ctx.rotate(Math.sin(t) * 0.3);
  ctx.fillStyle = '#ffd65c';
  ctx.beginPath();
  ctx.moveTo(0, -13); ctx.lineTo(9, -4); ctx.lineTo(6, 12); ctx.lineTo(-6, 12); ctx.lineTo(-9, -4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(5, -3); ctx.lineTo(0, 2); ctx.lineTo(-5, -3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LOOT', world.loot.x, world.loot.y + 26);
  ctx.textAlign = 'left';
}
function drawLures(ctx, noises, marks) {
  ctx.fillStyle = COLORS.lure;
  for (const m of marks) { ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, Math.PI * 2); ctx.fill(); }
  const now = performance.now();
  for (const n of noises) {
    if (n.kind !== 'lure') continue;
    const age = (now - n.born) / 1000;
    if (age > 3) continue;
    ctx.strokeStyle = 'rgba(201,247,160,' + (1 - age / 3) * 0.6 + ')';
    ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * Math.min(1, age), 0, Math.PI * 2); ctx.stroke();
  }
}
function drawCones(ctx, world, guards) {
  for (const g of guards) {
    const color = g.state === 'chase' ? COLORS.guardAlert : (g.state === 'suspicious' || g.state === 'search') ? COLORS.guardSusp : COLORS.coneEdge;
    const fill = g.state === 'chase' ? 'rgba(255,82,56,0.32)' : g.state === 'patrol' ? 'rgba(103,212,224,0.20)' : 'rgba(240,201,107,0.26)';
    const half = (GUARD.fov * Math.PI / 180) / 2, steps = 14, pts = [];
    for (let i = 0; i <= steps; i++) {
      const a = g.facing - half + (2 * half * i) / steps;
      let d = GUARD.range;
      for (let s = 20; s < GUARD.range; s += 14) {
        const px = g.x + Math.cos(a) * s, py = g.y + Math.sin(a) * s;
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
        if (world.walls.has(tx + ',' + ty)) { d = s; break; }
      }
      pts.push([g.x + Math.cos(a) * d, g.y + Math.sin(a) * d]);
    }
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.moveTo(g.x, g.y);
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(g.x, g.y);
    for (const [px, py] of pts) ctx.lineTo(px, py);
    ctx.closePath(); ctx.stroke();
    // suspicion meter above the head
    if (g.alert > 0.05) {
      ctx.fillStyle = '#000a'; ctx.fillRect(g.x - 14, g.y - 22, 28, 5);
      ctx.fillStyle = color; ctx.fillRect(g.x - 13, g.y - 21, 26 * Math.min(1, g.alert), 3);
    }
  }
}
function drawGuards(ctx, guards) {
  for (const g of guards) {
    ctx.fillStyle = g.state === 'chase' ? COLORS.guardAlert : COLORS.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = g.facing; // reuse stroke for facing tick
    ctx.strokeStyle = '#2a1410'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 13, g.y + Math.sin(g.facing) * 13);
    ctx.stroke();
  }
}
function drawPlayer(ctx, player, world) {
  const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 30);
  glow.addColorStop(0, 'rgba(140,190,255,0.35)');
  glow.addColorStop(1, 'rgba(140,190,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(player.x, player.y, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = player.crouch ? COLORS.playerCrouch : COLORS.player;
  ctx.strokeStyle = '#dfeaff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.crouch ? 7 : 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (player.hasLoot) {
    ctx.strokeStyle = COLORS.loot; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(player.x, player.y, 15, 0, Math.PI * 2); ctx.stroke();
  }
}
function drawShadow(ctx, world, player, time) {
  let lit = 0;
  for (const lamp of world.lamps) {
    const d = Math.hypot(lamp.x - player.x, lamp.y - player.y);
    const r = 150 * (1 + Math.sin(time * 0.006 + lamp.x) * 0.12);
    if (d < r) lit = Math.max(lit, 1 - d / r);
  }
  player.shadowed = Math.min(1, lit);
  ctx.fillStyle = COLORS.shadow;
  ctx.globalAlpha = 1 - lit * 0.75;
  for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
    if (!world.walls.has(x + ',' + y)) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  }
  ctx.globalAlpha = 1;
}
function drawHud(ctx, game) {
  ctx.save();
  ctx.font = '13px "Courier New", monospace';
  ctx.fillStyle = '#0a0e18cc'; ctx.fillRect(8, 8, 250, 94);
  ctx.fillStyle = '#cfd6e4';
  ctx.fillText('JOB ' + (game.levelIndex + 1) + '/3  ' + game.levelName.slice(0, 22), 16, 26);
  ctx.fillStyle = '#6b7890'; ctx.fillText('SOUND', 16, 44);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(60, 36, 160, 9);
  const nl = game.player.noiseLevel;
  ctx.fillStyle = nl > 0.6 ? '#ff5238' : nl > 0.3 ? '#f0c96b' : '#63e6a0';
  ctx.fillRect(60, 36, 160 * nl, 9);
  ctx.fillStyle = '#6b7890'; ctx.fillText('LIGHT', 16, 60);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(60, 52, 160, 9);
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(60, 52, 160 * (game.player.shadowed ?? 0), 9);
  ctx.fillStyle = '#cfd6e4'; ctx.fillText('GEAR x' + game.player.lures + (game.player.hasLoot ? '  [LOOT]' : ''), 16, 80);
  ctx.fillStyle = '#6b7890'; ctx.fillText('ALARM', 16, 96);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(60, 88, 160, 9);
  ctx.fillStyle = game.alarm > 0.7 ? '#ff5238' : game.alarm > 0.35 ? '#f0c96b' : '#63e6a0';
  ctx.fillRect(60, 88, 160 * (game.alarm ?? 0), 9);
  ctx.strokeStyle = game.alarm > 0.35 ? '#ff5238' : '#2a3a52'; ctx.lineWidth = 1;
  ctx.strokeRect(59.5, 87.5, 161, 10);
  if (game.alertMax > 0.3) {
    ctx.fillStyle = game.alertMax >= 1 ? '#ff5238' : '#f0c96b';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(game.alertMax >= 1 ? 'ALERT! THEY SEE YOU' : 'SUSPICIOUS...', VIEW_W / 2 - 90, 34);
  }
  ctx.restore();
}
