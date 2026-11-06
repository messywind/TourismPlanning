import { readdir, readFile, stat, lstat, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validatePlan(p, slug) {
  if (!slugPattern.test(slug) || slug.length > 80 || p.slug !== slug) throw new Error(`Invalid or mismatched slug: ${slug}`);
  for (const key of ['title', 'destination', 'summary']) {
    if (typeof p[key] !== 'string' || !p[key].trim()) throw new Error(`${slug}: missing ${key}`);
  }
  if (!validDate(p.startDate) || !validDate(p.endDate) || p.endDate < p.startDate) throw new Error(`${slug}: invalid date range`);
  if (!Number.isInteger(p.travelers) || p.travelers < 1 || p.travelers > 1000) throw new Error(`${slug}: travelers must be a positive integer`);
  if (!['draft', 'ready'].includes(p.status)) throw new Error(`${slug}: status must be draft or ready`);
  if (!Array.isArray(p.tags) || p.tags.some(x => typeof x !== 'string')) throw new Error(`${slug}: tags must be strings`);
  if (typeof p.cover !== 'string' || !p.cover.startsWith('assets/') || p.cover.includes('..') || p.cover.includes('\\') || /[?#]/.test(p.cover)) throw new Error(`${slug}: cover must be a local assets/ path`);
  return p;
}
export async function assertPlainTree(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    const info = await lstat(full);
    if (info.isSymbolicLink()) throw new Error(`Symlinks are not supported in plan content: ${full}`);
    if (info.isDirectory()) await assertPlainTree(full);
    else if (!info.isFile()) throw new Error(`Unsupported file: ${full}`);
  }
}
export async function loadPlans(root = ROOT, { includeDrafts = false } = {}) {
  const dir = path.join(root, 'plans');
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const item of entries.sort((a,b) => a.name.localeCompare(b.name))) {
    if (item.name.startsWith('.')) continue;
    if (!item.isDirectory()) throw new Error(`Expected a plan directory: ${item.name}`);
    const base = path.join(dir, item.name);
    await assertPlainTree(base);
    const p = validatePlan(JSON.parse(await readFile(path.join(base, 'plan.json'), 'utf8')), item.name);
    for (const file of ['index.html', p.cover]) {
      if (!(await stat(path.join(base, file))).isFile()) throw new Error(`${item.name}: missing file ${file}`);
    }
    if (p.status === 'ready' || includeDrafts) result.push(p);
  }
  return result.sort((a,b) => b.startDate.localeCompare(a.startDate));
}
export async function copyTree(source, destination, { exclude = new Set() } = {}) {
  await mkdir(destination, { recursive: true });
  for (const item of await readdir(source, { withFileTypes: true })) {
    if (item.name.startsWith('.') || exclude.has(item.name)) continue;
    const src = path.join(source, item.name), dest = path.join(destination, item.name);
    if (item.isSymbolicLink()) throw new Error(`Refusing symlink: ${src}`);
    if (item.isDirectory()) await copyTree(src, dest, { exclude });
    else if (item.isFile()) await copyFile(src, dest);
  }
}
export const htmlEscape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
