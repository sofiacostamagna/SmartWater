import { FC, useContext, useState } from "react";
import "./ArqueoDeCaja.css";
import { PageTitle } from "../../../components/PageTitle/PageTitle";
import { TableArqueoCaja } from "./TableArqueoCaja/TableArqueoCaja";

import { useForm, SubmitHandler } from "react-hook-form";
import { CashOpen, Transaction } from "../../../../../type/Cash";
import Input from "../../../EntryComponents/Inputs";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useCallback, useEffect } from "react";
import { CashRegisterApiConector, UsersApiConector } from "../../../../../api/classes";
import { User } from "../../../../../type/User";
import moment from "moment";
import momentTz from "moment-timezone";
import { useGlobalContext } from "../../../../SmartwaterContext";
import { ArqueoDeCajaContext } from "./ArqueoDeCajaContext";
import Modal from "../../../EntryComponents/Modal";
import FiltroArqueoDeCaja from "./FiltroArqueoDeCaja";

interface IArqueoFilters {
  fromDate: string | null;
  toDate: string | null;
}

const ArqueoDeCaja: FC = () => {
  const [arqueos, setArqueos] = useState<Transaction[]>([]);
  const [justCrated, setJustCreated] = useState<string | null>(null);
  const [filteredArqueos, setFilteredArqueos] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<IArqueoFilters>({ fromDate: null, toDate: null });
  const [showFiltro, setShowFiltro] = useState<boolean>(false);
  const [dist, setDist] = useState<User[]>([]);

  const { setSelectedTransaction } = useContext(ArqueoDeCajaContext);
  const { setLoading } = useGlobalContext();

  const getData = useCallback(async () => {
    const res = await CashRegisterApiConector.get({}) || [];
    setArqueos(res);
    setFilteredArqueos(res);

    if (justCrated) {
      setSelectedTransaction(res.find(r => r._id === justCrated));
      setJustCreated(null);
    }

    setLoading(false);
  }, [justCrated, setSelectedTransaction, setLoading]);

  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    UsersApiConector.get({ pagination: { page: 1, pageSize: 30000 } }).then(res => setDist(res?.data || []));
  }, []);

  useEffect(() => {
    if (filters.fromDate || filters.toDate) {
      const filtered = arqueos.filter((arqueo) => {
        const startDate = moment(arqueo.startDate);
        const fromDate = filters.fromDate ? moment(filters.fromDate) : null;
        const toDate = filters.toDate ? moment(filters.toDate) : null;

        return (
          (!fromDate || startDate.isSameOrAfter(fromDate)) &&
          (!toDate || startDate.isSameOrBefore(toDate))
        );
      });
      setFilteredArqueos(filtered);
    } else {
      setFilteredArqueos(arqueos);
    }
  }, [filters, arqueos]);

  const {
    register,
    formState: { errors, isValid },
    handleSubmit,
    watch,
    reset
  } = useForm<CashOpen>({
    mode: 'all'
  });

  const onSubmit: SubmitHandler<CashOpen> = async (data) => {
    setLoading(true);
    let res: any | null = null;

    if (data.endDate) {
      res = await CashRegisterApiConector.openClose({
        data: {
          initialAmount: data.initialAmount,
          startDate: momentTz.tz(data.startDate, "America/La_Paz").format(),
          user: data.user,
          endDate: momentTz.tz(data.endDate, "America/La_Paz").format()
        }
      });
    } else {
      res = await CashRegisterApiConector.open({
        data: {
          initialAmount: data.initialAmount,
          startDate: momentTz.tz(data.startDate, "America/La_Paz").format(),
          user: data.user
        }
      });
    }

    if (res) {
      if (data.endDate) {
        if ('arqueo' in res) {
          setJustCreated(res.arqueo?._id || "");
          reset();
          toast.success(res.message || "Arqueo de caja creado");
        } else {
          toast.error("Upps error al guardar el arqueo de caja");
        }
      } else {
        if (typeof res.cashRegister === 'object' && 'error' in res.cashRegister) {
          toast.error(res.cashRegister.error);
        } else {
          toast.success("Arqueo de caja creado");
          setJustCreated(res.cashRegister);
          reset();
        }
      }
    } else {
      toast.error("Upps error al guardar el arqueo de caja");
    }
    setLoading(false);
  };

  const validateHours = (val: string, type: 'init' | 'end'): string | boolean => {
    if (type === 'init') {
      const hasEnd = watch('endDate');
      const init = moment(val);
      const end = hasEnd ? moment(watch('endDate')) : moment();

      if (init.isSameOrAfter(end)) {
        return `La fecha de apertura debe ser menor que la fecha y hora ${hasEnd ? "de cierre" : "actual"}`;
      }

      return true;
    }

    if (type === 'end') {
      const hasStart = watch('startDate');
      const check = moment(val);
      const init = hasStart ? moment(watch('startDate')) : undefined;
      const end = moment();

      if (check.isAfter(end)) {
        return `La fecha de cierre debe ser menor que la fecha y hora actual`;
      }
      if (init && check.isSameOrBefore(init)) {
        return `La fecha de cierre debe ser mayor que la fecha y hora de apertura`;
      }

      return true;
    }

    return true;
  };

  return (
    <>
      <div className="px-10 h-screen overflow-y-auto pb-10">
        <PageTitle titulo="Arqueo De Cajas" icon="../Finanzas-icon.svg" />
        <div className="w-full p-6">
          {/* Filter and Table in same row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Filter button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowFiltro(true)}
                className="boton-filtro relative px-4 py-2 rounded-md flex items-center border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <span style={{ marginRight: "5px" }}>Filtrar</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <g clipPath="url(#clip0_35_4995)">
                    <path
                      d="M0 19.5C0 18.6703 0.670312 18 1.5 18H4.06406C4.64062 16.6734 5.9625 15.75 7.5 15.75C9.0375 15.75 10.3594 16.6734 10.9359 18H22.5C23.3297 18 24 18.6703 24 19.5C24 20.3297 23.3297 21 22.5 21H10.9359C10.3594 22.3266 9.0375 23.25 7.5 23.25C5.9625 23.25 4.64062 22.3266 4.06406 21H1.5C0.670312 21 0 20.3297 0 19.5ZM9 19.5C9 18.6703 8.32969 18 7.5 18C6.67031 18 6 18.6703 6 19.5C6 20.3297 6.67031 21 7.5 21C8.32969 21 9 20.3297 9 19.5ZM18 12C18 11.1703 17.3297 10.5 16.5 10.5C15.6703 10.5 15 11.1703 15 12C15 12.8297 15.6703 13.5 16.5 13.5C17.3297 13.5 18 12.8297 18 12ZM16.5 8.25C18.0375 8.25 19.3594 9.17344 19.9359 10.5H22.5C23.3297 10.5 24 11.1703 24 12C24 12.8297 23.3297 13.5 22.5 13.5H19.9359C19.3594 14.8266 18.0375 15.75 16.5 15.75C14.9625 15.75 13.6406 14.8266 13.0641 13.5H1.5C0.670312 13.5 0 12.8297 0 12C0 11.1703 0.670312 10.5 1.5 10.5H13.0641C13.6406 9.17344 14.9625 8.25 16.5 8.25ZM9 3C8.17031 3 7.5 3.67031 7.5 4.5C7.5 5.32969 8.17031 6 9 6C9.82969 6 10.5 5.32969 10.5 4.5C10.5 3.67031 9.82969 3 9 3ZM12.4359 3H22.5C23.3297 3 24 3.67031 24 4.5C24 5.32969 23.3297 6 22.5 6H12.4359C11.8594 7.32656 10.5375 8.25 9 8.25C7.4625 8.25 6.14062 7.32656 5.56406 6H1.5C0.670312 6 0 5.32969 0 4.5C0 3.67031 0.670312 3 1.5 3H5.56406C6.14062 1.67344 7.4625 0.75 9 0.75C10.5375 0.75 11.8594 1.67344 12.4359 3Z"
                      fill="currentColor"
                    ></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_35_4995">
                      <rect width="24" height="24" fill="white"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              <TableArqueoCaja cash={filteredArqueos} />
            </div>
          </div>

          {/* Filter modal */}
          <Modal isOpen={showFiltro} onClose={() => setShowFiltro(false)}>
            <FiltroArqueoDeCaja
              onChange={(newFilters: IArqueoFilters) => setFilters(newFilters)}
              setShowFiltro={setShowFiltro}
            />
          </Modal>

          {/* New cash register form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="ArqueoCaja-containerform w-full lg:w-1/2 mt-10">
              <div className="ArqueoCaja-tituloform">
                <span>Nuevo arqueo de caja</span>
              </div>
              <div className="ArqueoCaja-bodyform">
                <Input
                  label="Fecha y hora de apertura"
                  name="startDate"
                  type="datetime-local"
                  errors={errors.startDate}
                  register={register}
                  required
                  className="full-selector"
                  max={watch('endDate') ? moment(watch('endDate')!.toString()).format("YYYY-MM-DDTHH:mm") : moment().format("YYYY-MM-DDTHH:mm")}
                />
                <Input
                  label="Fecha y hora de cierre"
                  name="endDate"
                  type="datetime-local"
                  errors={errors.endDate}
                  register={register}
                  className="full-selector"
                  min={watch('startDate') ? moment(watch('startDate')!.toString()).format("YYYY-MM-DDTHH:mm") : undefined}
                  max={moment().format("YYYY-MM-DDTHH:mm")}
                />
                <Input
                  label="Monto inicial BS."
                  name="initialAmount"
                  type="number"
                  errors={errors.initialAmount}
                  register={register}
                  required
                  min={0}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full flex flex-col gap-2"
                >
                  <label>Distribuidor</label>
                  <select
                    {...register("user", { required: "Selecciona un distribuidor" })}
                    className="p-2 py-2.5 rounded-md font-pricedown focus:outline-4 bg-main-background outline outline-2 outline-black"
                  >
                    <option value="null">Seleccione un proveedor</option>
                    {dist.length > 0 &&
                      dist.map((city, index) => (
                        <option value={city._id} key={index} className="text-font-color">
                          {city.fullName || "Sin nombre"} {city.role === 'admin' && "(Administrador)"}
                        </option>
                      ))}
                  </select>
                  {errors.user && (
                    <span className="text-red-500 font-normal text-sm font-pricedown">
                      <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                      {errors.user.message}
                    </span>
                  )}
                </motion.div>
              </div>
              <div className="flex justify-center items-center">
                <button
                  type="submit"
                  className="ArqueoCaja-btn disabled:bg-gray-400"
                  disabled={!isValid}
                >
                  {!!watch('endDate') ? "Calcular" : "Iniciar"} arqueo
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export { ArqueoDeCaja };