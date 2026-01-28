"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Database } from "@/types/supabase";

type ActionState = {
  ok: boolean;
  error: string;
};

export async function createItineraryItem(
  formData: FormData
): Promise<ActionState>;
export async function createItineraryItem(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState>;
export async function createItineraryItem(
  formDataOrState: FormData | ActionState,
  maybeFormData?: FormData
): Promise<ActionState> {
  const supabaseAdmin = getSupabaseAdmin();
  const formData =
    formDataOrState instanceof FormData ? formDataOrState : maybeFormData;

  if (!formData) {
    return { ok: false, error: "Invalid form submission." };
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const dayLabel = String(formData.get("day_label") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const websiteUrl = String(formData.get("website_url") ?? "").trim() || null;
  const sortOrderRaw = formData.get("sort_order");
  const sortOrder =
    sortOrderRaw && String(sortOrderRaw).trim() !== ""
      ? Number(sortOrderRaw)
      : null;

  if (!category) {
    return { ok: false, error: "Category is required." };
  }

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  const payload: Database["public"]["Tables"]["itinerary_items"]["Insert"] = {
    category,
    title,
    is_active: true
  };

  if (dayLabel) payload.day_label = dayLabel;
  if (description) payload.description = description;
  if (address) payload.address = address;
  if (websiteUrl) payload.website_url = websiteUrl;
  if (sortOrder !== null) payload.sort_order = sortOrder;

  const { error } = await supabaseAdmin.from("itinerary_items").insert(payload);

  if (error) {
    console.error("Error creating itinerary item:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(
    eventId ? `/admin/itinerary?eventId=${eventId}` : "/admin/itinerary"
  );
  return { ok: true, error: "" };
}

export async function deleteItineraryItem(
  formData: FormData
): Promise<ActionState> {
  const supabaseAdmin = getSupabaseAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const eventId = String(formData.get("event_id") ?? "").trim();

  if (!id) {
    return { ok: false, error: "Missing item id." };
  }

  const { error } = await supabaseAdmin
    .from("itinerary_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting itinerary item:", error);
    return { ok: false, error: error.message };
  }

  if (eventId) {
    revalidatePath(`/admin/itinerary?eventId=${eventId}`);
  } else {
    revalidatePath("/admin/itinerary");
  }

  return { ok: true, error: "" };
}
