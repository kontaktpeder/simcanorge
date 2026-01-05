import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface Car {
  id: string;
  title: string;
  model: string;
  year: number | null;
  featured: boolean;
  published_at: string | null;
  created_at: string;
}

const AdminBiler = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCars = async () => {
    const { data, error } = await supabase
      .from("cars")
      .select("id, title, model, year, featured, published_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cars:", error);
      toast.error("Kunne ikke hente biler");
    } else {
      setCars(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const togglePublish = async (car: Car) => {
    const newPublishedAt = car.published_at ? null : new Date().toISOString();
    
    const { error } = await supabase
      .from("cars")
      .update({ published_at: newPublishedAt })
      .eq("id", car.id);

    if (error) {
      toast.error("Kunne ikke oppdatere status");
    } else {
      toast.success(newPublishedAt ? "Bil publisert!" : "Bil avpublisert");
      fetchCars();
    }
  };

  const deleteCar = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne bilen?")) return;

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      toast.error("Kunne ikke slette bil");
    } else {
      toast.success("Bil slettet");
      fetchCars();
    }
  };

  return (
    <AdminLayout title="BILER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {cars.length} bil{cars.length !== 1 ? "er" : ""} totalt
        </p>
        <button className="btn-retro bg-primary">
          <Plus className="w-5 h-5 mr-2" />
          Ny bil
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Laster...</div>
      ) : cars.length === 0 ? (
        <div className="retro-card text-center py-12">
          <p className="text-muted-foreground mb-4">Ingen biler lagt til ennå</p>
          <button className="btn-retro">
            <Plus className="w-5 h-5 mr-2" />
            Legg til din første bil
          </button>
        </div>
      ) : (
        <div className="bg-card border-4 border-foreground overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-display">TITTEL</th>
                <th className="text-left p-4 font-display">MODELL</th>
                <th className="text-left p-4 font-display">ÅR</th>
                <th className="text-left p-4 font-display">STATUS</th>
                <th className="text-right p-4 font-display">HANDLINGER</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {car.featured && (
                        <span className="bg-accent text-accent-foreground text-xs px-2 py-1 font-display">
                          FEATURED
                        </span>
                      )}
                      <span className="font-medium">{car.title}</span>
                    </div>
                  </td>
                  <td className="p-4">{car.model}</td>
                  <td className="p-4">{car.year || "-"}</td>
                  <td className="p-4">
                    {car.published_at ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Publisert
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <EyeOff className="w-4 h-4" />
                        Kladd
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => togglePublish(car)}
                        className="p-2 hover:bg-muted rounded"
                        title={car.published_at ? "Avpubliser" : "Publiser"}
                      >
                        {car.published_at ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded"
                        title="Rediger"
                      >
                        <Pencil className="w-5 h-5 text-primary" />
                      </button>
                      <button
                        onClick={() => deleteCar(car.id)}
                        className="p-2 hover:bg-muted rounded"
                        title="Slett"
                      >
                        <Trash2 className="w-5 h-5 text-accent" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBiler;
