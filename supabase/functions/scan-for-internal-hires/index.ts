import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequisitionRecord {
  id: number;
  manager_id: string;
  role_title: string;
  department: string;
  required_skills_json: any[];
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the requisition ID from the request
    const { requisition_id } = await req.json();
    
    if (!requisition_id) {
      throw new Error('requisition_id is required');
    }

    console.log(`Processing requisition ${requisition_id}`);

    // Fetch the requisition
    const { data: requisition, error: reqError } = await supabase
      .from('process_requisitions')
      .select('*')
      .eq('id', requisition_id)
      .single();

    if (reqError) {
      console.error('Error fetching requisition:', reqError);
      throw reqError;
    }

    if (!requisition) {
      throw new Error('Requisition not found');
    }

    console.log('Requisition data:', requisition);

    // Extract skill IDs from required_skills_json
    const requiredSkills = requisition.required_skills_json || [];
    const skillIds = requiredSkills.map((skill: any) => skill.id);

    console.log('Required skill IDs:', skillIds);

    if (skillIds.length === 0) {
      console.log('No skills required, updating status to PENDING_FINANCE');
      await supabase
        .from('process_requisitions')
        .update({ status: 'PENDING_FINANCE' })
        .eq('id', requisition_id);

      return new Response(
        JSON.stringify({ 
          message: 'No skills required, moved to PENDING_FINANCE',
          matching_employees: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call the PostgreSQL function to find matching employees
    const { data: matchingEmployees, error: matchError } = await supabase
      .rpc('find_matching_employees', { skill_ids_array: skillIds });

    if (matchError) {
      console.error('Error finding matching employees:', matchError);
      throw matchError;
    }

    console.log('Matching employees found:', matchingEmployees?.length || 0);

    // Gateway Logic: Update requisition status based on results
    if (matchingEmployees && matchingEmployees.length > 0) {
      // Internal candidates found
      console.log(`Found ${matchingEmployees.length} internal candidates`);
      
      await supabase
        .from('process_requisitions')
        .update({ status: 'PENDING_INTERNAL_REVIEW' })
        .eq('id', requisition_id);

      return new Response(
        JSON.stringify({ 
          message: 'Internal candidates found',
          matching_employees: matchingEmployees,
          status: 'PENDING_INTERNAL_REVIEW'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // No internal candidates, proceed to external hiring
      console.log('No internal candidates found, moving to PENDING_FINANCE');
      
      await supabase
        .from('process_requisitions')
        .update({ status: 'PENDING_FINANCE' })
        .eq('id', requisition_id);

      return new Response(
        JSON.stringify({ 
          message: 'No internal candidates found, moved to PENDING_FINANCE',
          matching_employees: [],
          status: 'PENDING_FINANCE'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in scan-for-internal-hires:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});