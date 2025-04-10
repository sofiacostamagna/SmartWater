import { FC } from "react";
import { useForm } from "react-hook-form";
import moment from "moment";

interface FiltroArqueoDeCajaProps {
  onApplyFilters: (filters: { initialDate: string; finalDate: string }) => void;
  onResetFilters: () => void;
  initialFilters: { initialDate: string; finalDate: string };
}

const FiltroArqueoDeCaja: FC<FiltroArqueoDeCajaProps> = ({
  onApplyFilters,
  onResetFilters,
  initialFilters,
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<{
    initialDate: string;
    finalDate: string;
  }>({
    defaultValues: initialFilters,
  });

  const onSubmit = (data: { initialDate: string; finalDate: string }) => {
    onApplyFilters(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-8 flex flex-col gap-8"
    >
      <div className="flex-1">
        <div className="FiltroClientes-Fechastitulo mb-2">
          <span className="text-blue_custom font-semibold">Fechas</span>
        </div>
        <div className="flex gap-3 w-full">
          <div className="shadow-xl rounded-3xl px-4 py-2 border-gray-100 border flex-1 relative">
            <span className="text-left text-sm">De</span>
            <img
              src="/desde.svg"
              alt=""
              className="w-[20px] h-[20px] absolute bottom-3 left-4 invert-0 dark:invert"
            />
            <input
              max={watch("finalDate") || moment().format("YYYY-MM-DD")}
              type="date"
              {...register("initialDate")}
              className="border-0 rounded outline-none font-semibold w-full bg-transparent text-sm full-selector pl-10"
            />
          </div>
          <div className="shadow-xl rounded-3xl px-4 py-2 border-gray-100 border flex-1 relative">
            <span className="text-left text-sm">A</span>
            <img
              src="/hasta.svg"
              alt=""
              className="w-[20px] h-[20px] absolute bottom-3 left-4 invert-0 dark:invert"
            />
            <input
              min={watch("initialDate")}
              max={moment().format("YYYY-MM-DD")}
              type="date"
              {...register("finalDate")}
              className="border-0 rounded outline-none font-semibold w-full bg-transparent text-sm full-selector pl-10"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between w-full items-center gap-3 px-4">
        <button
          type="button"
          onClick={() => {
            setValue("initialDate", "");
            setValue("finalDate", "");
            onResetFilters();
          }}
          className="mt-4 border-blue-500 border-2 rounded-full px-4 py-2.5 shadow-xl text-blue-500 font-bold w-full"
        >
          Quitar Filtros
        </button>
        <button
          type="submit"
          className="mt-4 bg-blue-500 border-2 border-blue-500 shadow-xl text-white rounded-full px-4 py-2.5 w-full font-bold"
        >
          Aplicar Filtros
        </button>
      </div>
    </form>
  );
};

export { FiltroArqueoDeCaja };
