-- =============================================
-- CRM Gabriele Justino v3 - Schema
-- Execute no SQL Editor do Supabase
-- =============================================

-- Limpar tabelas anteriores se existirem
DROP TABLE IF EXISTS case_updates CASCADE;
DROP TABLE IF EXISTS custas CASCADE;
DROP TABLE IF EXISTS deadlines CASCADE;
DROP TABLE IF EXISTS processes CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- Tabela de clientes
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf TEXT,
  origin TEXT DEFAULT 'Outro',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de casos (extrajudicial)
CREATE TABLE cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Consulta Inicial',
  fees NUMERIC(12,2) DEFAULT 0,
  fees_paid NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'Pendente',
  notes TEXT,
  linked_process_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de processos (judicial)
CREATE TABLE processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  process_number TEXT,
  court TEXT,
  opposing_party TEXT,
  opposing_lawyer TEXT,
  system TEXT DEFAULT 'SAJ',
  status TEXT DEFAULT 'Em andamento',
  fees NUMERIC(12,2) DEFAULT 0,
  fees_paid NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'Pendente',
  notes TEXT,
  linked_case_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de prazos (vinculados a caso OU processo)
CREATE TABLE deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('case', 'process')),
  entity_id UUID NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  due_time TEXT,
  urgency TEXT DEFAULT 'Comum' CHECK (urgency IN ('Urgente', 'Comum')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de atualizações (timeline)
CREATE TABLE case_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('case', 'process')),
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  update_date DATE DEFAULT CURRENT_DATE,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de custas
CREATE TABLE custas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('case', 'process')),
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL DEFAULT 0,
  custa_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custas ENABLE ROW LEVEL SECURITY;

-- Clients
CREATE POLICY "clients_select" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Cases
CREATE POLICY "cases_select" ON cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cases_insert" ON cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cases_update" ON cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cases_delete" ON cases FOR DELETE USING (auth.uid() = user_id);

-- Processes
CREATE POLICY "processes_select" ON processes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "processes_insert" ON processes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "processes_update" ON processes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "processes_delete" ON processes FOR DELETE USING (auth.uid() = user_id);

-- Deadlines
CREATE POLICY "deadlines_select" ON deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deadlines_insert" ON deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deadlines_update" ON deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deadlines_delete" ON deadlines FOR DELETE USING (auth.uid() = user_id);

-- Updates
CREATE POLICY "updates_select" ON case_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "updates_insert" ON case_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "updates_delete" ON case_updates FOR DELETE USING (auth.uid() = user_id);

-- Custas
CREATE POLICY "custas_select" ON custas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "custas_insert" ON custas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "custas_update" ON custas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "custas_delete" ON custas FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Auto-update timestamps
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cases_updated BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER processes_updated BEFORE UPDATE ON processes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
