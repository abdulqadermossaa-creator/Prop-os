import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { Building2, MapPin } from "lucide-react";

export default function PropertyCard({ name, status, rent, location, units, onClick }) {
  const statusType =
    status === "Occupied" ? "occupied" :
    status === "Vacant" ? "vacant" :
    status === "Maintenance" ? "maintenance" : "default";

  return (
    <div
      className="bg-panel p-5 rounded-2xl border border-blue/10 hover:border-blue/30 hover:shadow-glow transition-all duration-300 hover:scale-[1.01] animate-fadeIn cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue/10 text-blue">
            <Building2 size={14} />
          </div>
          <h3 className="font-semibold text-white">{name}</h3>
        </div>
        <Badge label={status} type={statusType} />
      </div>

      {location && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={10} />
          <span>{location}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Monthly Rent</p>
          <p className="text-lg font-bold text-white">
            {rent} <span className="text-xs text-gray-400 font-normal">SAR</span>
          </p>
        </div>
        {units && (
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-0.5">Units</p>
            <p className="text-lg font-bold text-cyan">{units}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <Button variant="ghost" className="text-xs w-full justify-center">
          View Details →
        </Button>
      </div>
    </div>
  );
}
