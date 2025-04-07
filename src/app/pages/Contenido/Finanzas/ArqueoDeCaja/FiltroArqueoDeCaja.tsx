import React from 'react';
import { useForm } from "react-hook-form";
import { Dispatch, SetStateAction } from "react";
import moment from "moment";

interface IArqueoFilters {
  fromDate: string | null;
  toDate: string | null;
}

const initialState: IArqueoFilters = {
  fromDate: null,
  toDate: null,
};

interface FiltroArqueoDeCajaProps {
  onChange: (filters: IArqueoFilters) => void;
  setShowFiltro: Dispatch<SetStateAction<boolean>>;
}

const FiltroArqueoDeCaja: React.FC<FiltroArqueoDeCajaProps> = ({
  onChange,
  setShowFiltro,
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<IArqueoFilters>({
    defaultValues: initialState,
  });

  const onSubmit = (data: IArqueoFilters) => {
    onChange(data);
    setShowFiltro(false);
  };

  const clearFilters = () => {
    setValue("fromDate", null, { shouldValidate: true });
    setValue("toDate", null, { shouldValidate: true });
    onChange(initialState);
    setShowFiltro(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-blue_custom">Fechas</label>
        <div className="flex gap-3">
          <div className="shadow-xl rounded-3xl px-4 py-2 border-gray-100 border flex-1 relative">
            <span className="text-left text-sm">De</span>
            <input
              max={watch("toDate")?.toString() || moment().format("YYYY-MM-DD")}
              type="date"
              {...register("fromDate")}
              className="border-0 rounded outline-none font-semibold w-full bg-transparent text-sm full-selector pl-2"
            />
          </div>
          <div className="shadow-xl rounded-3xl px-4 py-2 border-gray-100 border flex-1 relative">
            <span className="text-left text-sm">A</span>
            <input
              min={watch("fromDate")?.toString()}
              max={moment().format("YYYY-MM-DD")}
              type="date"
              {...register("toDate")}
              className="border-0 rounded outline-none font-semibold w-full bg-transparent text-sm full-selector pl-2"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between w-full items-center gap-3">
        <button
          type="button"
          onClick={clearFilters}
          className="border-blue-500 border-2 rounded-full px-4 py-2.5 shadow-xl text-blue-500 font-bold w-full"
        >
          Quitar Filtros
        </button>
        <button
          type="submit"
          className="bg-blue-500 border-2 border-blue-500 shadow-xl text-white rounded-full px-4 py-2.5 w-full font-bold"
        >
          Aplicar Filtros
        </button>
      </div>
    </form>
  );
};

export default FiltroArqueoDeCaja;