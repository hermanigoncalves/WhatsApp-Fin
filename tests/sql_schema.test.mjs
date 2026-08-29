import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('🗄️ Validação Sintática e de Integridade de Schemas SQL & RLS', () => {
  const schemaPath = path.resolve('supabase/schema.sql');
  const creditCardsMigrationPath = path.resolve('supabase/migrations/20260313000001_create_credit_cards.sql');
  const whatsappMigrationPath = path.resolve('supabase/migrations/whatsapp_financeiro_schema.sql');

  it('O schema.sql mestre deve existir e conter as tabelas essenciais', () => {
    assert.ok(fs.existsSync(schemaPath), 'schema.sql deve existir');
    const content = fs.readFileSync(schemaPath, 'utf8');

    assert.match(content, /create table if not exists public\.credit_cards/i);
    assert.match(content, /create table if not exists public\.whatsapp_instances/i);
    assert.match(content, /create table if not exists public\.transacoes/i);
    assert.match(content, /create table if not exists public\.profiles/i);
  });

  it('Todas as tabelas críticas no schema.sql devem ter RLS habilitado', () => {
    const content = fs.readFileSync(schemaPath, 'utf8');

    assert.match(content, /alter table public\.credit_cards enable row level security/i);
    assert.match(content, /alter table public\.whatsapp_instances enable row level security/i);
    assert.match(content, /alter table public\.transacoes enable row level security/i);
    assert.match(content, /alter table public\.transactions enable row level security/i);
    assert.match(content, /alter table public\.accounts enable row level security/i);
  });

  it('A migration de credit_cards deve conter RLS com auth.uid() = user_id', () => {
    assert.ok(fs.existsSync(creditCardsMigrationPath), 'migration de credit_cards deve existir');
    const content = fs.readFileSync(creditCardsMigrationPath, 'utf8');

    assert.match(content, /ENABLE ROW LEVEL SECURITY/i);
    assert.match(content, /auth\.uid\(\)\s*=\s*user_id/i);
    assert.match(content, /closing_day INTEGER NOT NULL CHECK \(closing_day BETWEEN 1 AND 31\)/i);
  });

  it('A migration de whatsapp_financeiro deve conter políticas RLS e user_id', () => {
    assert.ok(fs.existsSync(whatsappMigrationPath), 'whatsapp_financeiro_schema deve existir');
    const content = fs.readFileSync(whatsappMigrationPath, 'utf8');

    assert.match(content, /user_id UUID REFERENCES auth\.users\(id\)/i);
    assert.match(content, /CREATE POLICY "whatsapp_instances_user_select"/i);
    assert.match(content, /CREATE POLICY "transacoes_user_select"/i);
  });
});
