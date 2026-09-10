import {
  database,
  HttpError,
  jsonBody,
  paidUser,
  route,
  sameOrigin,
} from '@/lib/server';
import { validatePack } from '@/lib/pack';
export const dynamic = 'force-dynamic';
export async function GET() {
  return route(async () => {
    const { id, limit } = await paidUser();
    const rows = await database()
      .prepare(
        'SELECT id, name, settings FROM templates WHERE user_id = ? ORDER BY created_at DESC',
      )
      .bind(id)
      .all<{ id: string; name: string; settings: string }>();
    return {
      templates: rows.results.map((row) => ({
        ...row,
        settings: JSON.parse(row.settings),
      })),
      limit,
    };
  });
}
export async function POST(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const { id, limit } = await paidUser(),
      body = await jsonBody(request);
    if (
      !body ||
      typeof body.name !== 'string' ||
      !body.name.trim() ||
      body.name.trim().length > 60
    )
      throw new HttpError(400, 'Give this template a name of 1–60 characters.');
    let settings;
    try {
      settings = validatePack(body.settings);
    } catch {
      throw new HttpError(400, 'Check the photo and signature settings.');
    }
    const templateId = crypto.randomUUID();
    const inserted = await database()
      .prepare(
        'INSERT INTO templates (id, user_id, name, settings, created_at) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM templates WHERE user_id = ?) < ?',
      )
      .bind(
        templateId,
        id,
        body.name.trim(),
        JSON.stringify(settings),
        Date.now(),
        id,
        limit,
      )
      .run();
    if (!inserted.meta.changes)
      throw new HttpError(
        409,
        `Your plan allows ${limit} templates. Delete one before saving another.`,
      );
    return { id: templateId };
  });
}
export async function DELETE(request: Request) {
  return route(async () => {
    sameOrigin(request);
    const { id } = await paidUser(),
      body = await jsonBody(request);
    if (!body || typeof body.id !== 'string')
      throw new HttpError(400, 'Choose a template.');
    await database()
      .prepare('DELETE FROM templates WHERE id = ? AND user_id = ?')
      .bind(body.id, id)
      .run();
    return { deleted: true };
  });
}
