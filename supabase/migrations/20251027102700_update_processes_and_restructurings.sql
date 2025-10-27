-- Migration: Update process tables and add restructuring & learning tables

-- ================================
-- Update process_requisitions table
-- ================================

-- Expand status values
ALTER TABLE public.process_requisitions
  DROP CONSTRAINT IF EXISTS process_requisitions_status_check;

ALTER TABLE public.process_requisitions
  ADD CONSTRAINT process_requisitions_status_check CHECK (
    status IN (
      'PENDING_SCAN',
      'PENDING_INTERNAL_REVIEW',
      'PENDING_FINANCE',
      'REJECTED_FINANCE',
      'PENDING_HR_QUEUE',
      'FILLED',
      'CANCELLED'
    )
  );

-- Add finance_notes column for finance rejections
ALTER TABLE public.process_requisitions
  ADD COLUMN IF NOT EXISTS finance_notes TEXT;


-- ================================
-- Update process_transfers table
-- ================================

-- Expand status values
ALTER TABLE public.process_transfers
  DROP CONSTRAINT IF EXISTS process_transfers_status_check;

ALTER TABLE public.process_transfers
  ADD CONSTRAINT process_transfers_status_check CHECK (
    status IN (
      'PENDING_APPROVALS',
      'PENDING_HR_FINALIZATION',
      'COMPLETED',
      'REJECTED'
    )
  );

-- Approval tracking & rejection notes
ALTER TABLE public.process_transfers
  ADD COLUMN IF NOT EXISTS current_manager_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS new_manager_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rejection_notes TEXT;


-- ================================
-- Add process_restructurings table
-- ================================

CREATE TABLE public.process_restructurings (
  id SERIAL PRIMARY KEY,
  plan_name TEXT,
  initiator_id UUID REFERENCES public.employees(id),
  status TEXT DEFAULT 'PENDING_ANALYSIS' CHECK (status IN ('PENDING_ANALYSIS', 'ANALYSIS_COMPLETE', 'EXECUTED')),
  segment_a_redeploy JSONB,
  segment_b_reskill JSONB,
  segment_c_exit JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.process_restructurings ENABLE ROW LEVEL SECURITY;

-- Timestamp trigger
CREATE TRIGGER update_process_restructurings_updated_at
  BEFORE UPDATE ON public.process_restructurings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ================================
-- Add employee_learning table
-- ================================

CREATE TABLE public.employee_learning (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id),
  program_name TEXT,
  status TEXT DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'CERTIFIED')),
  source_restructuring_id INT REFERENCES public.process_restructurings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employee_learning ENABLE ROW LEVEL SECURITY;

-- Timestamp trigger
CREATE TRIGGER update_employee_learning_updated_at
  BEFORE UPDATE ON public.employee_learning
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ================================
-- Update employees table
-- ================================

-- Add status column & constraint
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_status_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_status_check CHECK (
    status IN ('ACTIVE', 'PENDING_RESKILL', 'PENDING_EXIT', 'EXITED')
  );

-- DONE
