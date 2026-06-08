import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Tags, Plus, Trash2, Pencil, X, ArrowRight, ImageIcon } from "lucide-react";
import { API_BASE, getAccessToken } from "@/lib/auth";
import { SuccessModal } from "@/components/admin/SuccessModal";

export const Route = createFileRoute("/_layout/categories")({
  component: CategoriesPage,
});

interface Category {
  id: number;
  name: string;
}

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);

  // Fetch categories
  useEffect(() => {
    fetch(`${API_BASE}/movies/categories/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list: Category[] = Array.isArray(data) ? data : (data.results ?? []);
        setCategories(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    setError("");
    const name = newName.trim();
    if (!name) return setError("Category name is required.");

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/movies/categories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(Object.values(data).flat().join(" ") || "Failed to create category");
      }

      const created = await res.json();
      setCategories((prev) => [...prev, created]);
      setAddOpen(false);
      setNewName("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setError("");
    const name = newName.trim();
    if (!name) return setError("Category name is required.");
    if (!editingCategory) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/movies/categories/${editingCategory.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(Object.values(data).flat().join(" ") || "Failed to update category");
      }

      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCategory(null);
      setNewName("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id: number) => {
    setMenuId(null);
    const res = await fetch(`${API_BASE}/movies/categories/${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const empty = !loading && categories.length === 0;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl bg-card px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage movie categories</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="mt-6 min-w-0 overflow-hidden rounded-2xl bg-card shadow-sm">
        {loading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : empty ? (
          <div className="grid place-items-center py-20">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 text-center shadow-sm sm:p-12">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-muted">
                <Tags className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-bold">No category added yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create categories to organize movies on Cinehubs.
              </p>
              <button
                onClick={() => setAddOpen(true)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold"
              >
                Add new category <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[1fr_120px] gap-4 border-b border-border px-6 py-4 text-sm font-semibold">
              <div>Category Name</div>
              <div>Action</div>
            </div>

            {/* Desktop rows */}
            <div className="hidden sm:block">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-[1fr_120px] items-center gap-4 border-b border-border px-6 py-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                      <Tags className="h-5 w-5 text-gold" />
                    </div>
                    <span className="font-medium">{cat.name}</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuId(menuId === cat.id ? null : cat.id)}
                      className="grid h-10 w-10 place-items-center rounded-md hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {menuId === cat.id && (
                      <div className="absolute right-0 top-9 z-10 w-32 rounded-lg border border-border bg-card p-1 shadow-lg">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setNewName(cat.name);
                            setMenuId(null);
                          }}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted"
                        >
                          Edit <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted"
                        >
                          Delete <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {categories.map((cat) => (
                <div key={cat.id} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                      <Tags className="h-5 w-5 text-gold" />
                    </div>
                    <span className="min-w-0 flex-1 break-words font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewName(cat.name);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-destructive/30 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/8 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Category Modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold">Add New Category</h2>
                <p className="text-xs text-muted-foreground">Create a new movie category</p>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <label className="mb-1.5 block text-sm font-medium">Category Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Action, Drama, Comedy"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="border-t border-border px-5 py-4 sm:px-6 sm:py-4">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 disabled:opacity-60"
              >
                {saving ? "Adding..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEditingCategory(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold">Edit Category</h2>
                <p className="text-xs text-muted-foreground">Update the category name</p>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <label className="mb-1.5 block text-sm font-medium">Category Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-gold"
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
                autoFocus
              />
              {error && (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="border-t border-border px-5 py-4 sm:px-6 sm:py-4">
              <button
                onClick={handleEdit}
                disabled={saving}
                className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white transition-all hover:bg-gold/90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessModal open={success} onClose={() => setSuccess(false)} />
    </>
  );
}