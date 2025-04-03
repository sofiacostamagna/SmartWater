import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNotifications } from './NotificacionesContext'
import { motion } from 'framer-motion'
import NotificationBlock from './NotificationBlock'
import { NotificationsApiConector } from '../../../../api/classes'
import { Notification } from '../../../../type/Notification'
import InfiniteScroll from 'react-infinite-scroll-component'

const NotificationsDropdown = () => {
    const { closeNotifications, isOpenNotifications, notifications, openNotifications, markAllAsRead, markOneAsRead, setNotifications } = useNotifications()

    const ref = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const ITEMS_PER_PAGE = 10
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({
        read: null,
        resolve: null,
        deactivated: null, // Changed to null to avoid filtering out by default
    });
    const [isFilterOpen, setFilterOpen] = useState(false);

    const handleFilterChange = (filterKey: string, value: boolean) => {
        setFilters({
            read: null,
            resolve: null,
            deactivated: null,
            [filterKey]: value, // Apply only the selected filter
        });
    };

    const toggleFilter = () => setFilterOpen(!isFilterOpen);

    const clearFilters = () => {
        setFilters({
            read: null,
            resolve: null,
            deactivated: null,
        });
    };

    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            if (filters.read !== null && n.read !== filters.read) return false;
            if (filters.resolve !== null && n.resolve !== filters.resolve) return false;
            if (filters.deactivated !== null && n.deactivated !== filters.deactivated) return false;
            return true;
        });
    }, [notifications, filters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                closeNotifications();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeNotifications]);

    useEffect(() => {
        if (isOpenNotifications && containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
            setPage(1)
        }
    }, [isOpenNotifications])

    const markAsRead = (id: string) => {
        NotificationsApiConector.markAsRead({ notificationId: id }).then(res => {
            markOneAsRead(id)
        })
    }

    const markAllAsReadLocal = () => {
        NotificationsApiConector.markAllAsRead().then(res => {
            console.log(res)
            markAllAsRead()
        })
    }

    const handleDeleteNotification = (id: string) => {
        setNotifications((prevNotifications) => prevNotifications.filter((n) => n._id !== id)); // Update the context's notifications state
    };

    const notifToShow = useMemo<Notification[]>(() => notifications.slice(0, page * ITEMS_PER_PAGE), [page, notifications])

    return (
        <div ref={ref} className="bg-blue_custom text-xl text-white flex items-center justify-center px-4 rounded-full relative cursor-pointer hover:bg-blue-800 w-[45px] h-[45px]"
            onClick={() => {
                if (!isOpenNotifications) openNotifications()
                else closeNotifications()
            }}>
            <i className="fa-solid fa-bell"></i>
            {
                notifications.some(n => !n.read) &&
                <div className="bg-red-500 rounded-full p-2 absolute top-0 right-0" />
            }

            <motion.div
                ref={containerRef}
                onClick={(e) => { e.stopPropagation() }}
                initial={false}
                animate={{
                    height: isOpenNotifications ? 500 : 0,
                    borderWidth: isOpenNotifications ? 1 : 0,
                }}
                id='scrollableContainer'
                className={`notifications-container absolute top-full translate-y-3 right-0 min-w-[350px] z-[500] bg-blocks border dark:border-blocks shadow-md dark:shadow-slate-500 rounded-[20px] text-sm overflow-y-auto overflow-x-hidden`}>

                <div className="flex items-center justify-between mb-3 sticky top-0 bg-blocks z-10 py-4 px-7">
                    <h3 className='text-font-color text-base font-semibold'>Notificaciones</h3>
                    <i className={`fa-solid fa-envelope-open text-font-color text-base ${notifications.some(n => !n.read) ? "cursor-pointer" : "opacity-50 pointer-events-none cursor-not-allowed"}`} onClick={() => { markAllAsReadLocal() }}></i>
                </div>

                <div className="relative px-4 py-2">
                    <button
                        className="boton-filtro relative px-4 py-2 rounded-md flex items-center border bg-white hover:bg-gray-200 transition-colors"
                        onClick={toggleFilter}
                    >
                        <span style={{ marginRight: "5px", color: "black" }}>Filtros</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "black" }}>
                            <path d="M0 19.5C0 18.6703 0.670312 18 1.5 18H4.06406C4.64062 16.6734 5.9625 15.75 7.5 15.75C9.0375 15.75 10.3594 16.6734 10.9359 18H22.5C23.3297 18 24 18.6703 24 19.5C24 20.3297 23.3297 21 22.5 21H10.9359C10.3594 22.3266 9.0375 23.25 7.5 23.25C5.9625 23.25 4.64062 22.3266 4.06406 21H1.5C0.670312 21 0 20.3297 0 19.5ZM9 19.5C9 18.6703 8.32969 18 7.5 18C6.67031 18 6 18.6703 6 19.5C6 20.3297 6.67031 21 7.5 21C8.32969 21 9 20.3297 9 19.5ZM18 12C18 11.1703 17.3297 10.5 16.5 10.5C15.6703 10.5 15 11.1703 15 12C15 12.8297 15.6703 13.5 16.5 13.5C17.3297 13.5 18 12.8297 18 12ZM16.5 8.25C18.0375 8.25 19.3594 9.17344 19.9359 10.5H22.5C23.3297 10.5 24 11.1703 24 12C24 12.8297 23.3297 13.5 22.5 13.5H19.9359C19.3594 14.8266 18.0375 15.75 16.5 15.75C14.9625 15.75 13.6406 14.8266 13.0641 13.5H1.5C0.670312 13.5 0 12.8297 0 12C0 11.1703 0.670312 10.5 1.5 10.5H13.0641C13.6406 9.17344 14.9625 8.25 16.5 8.25ZM9 3C8.17031 3 7.5 3.67031 7.5 4.5C7.5 5.32969 8.17031 6 9 6C9.82969 6 10.5 5.32969 10.5 4.5C10.5 3.67031 9.82969 3 9 3ZM12.4359 3H22.5C23.3297 3 24 3.67031 24 4.5C24 5.32969 23.3297 6 22.5 6H12.4359C11.8594 7.32656 10.5375 8.25 9 8.25C7.4625 8.25 6.14062 7.32656 5.56406 6H1.5C0.670312 6 0 5.32969 0 4.5C0 3.67031 0.670312 3 1.5 3H5.56406C6.14062 1.67344 7.4625 0.75 9 0.75C10.5375 0.75 11.8594 1.67344 12.4359 3Z" fill="currentColor"></path>
                        </svg>
                    </button>
                    {isFilterOpen && (
                        <div className="absolute bg-white text-black border border-gray-300 rounded-md shadow-md mt-2 p-4 z-50">
                            <label className="block mb-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    name="filter"
                                    onChange={() => handleFilterChange('read', true)}
                                    checked={filters.read === true}
                                />
                                Leídos
                            </label>
                            <label className="block mb-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    name="filter"
                                    onChange={() => handleFilterChange('read', false)}
                                    checked={filters.read === false}
                                />
                                No leídos
                            </label>
                            <label className="block mb-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    name="filter"
                                    onChange={() => handleFilterChange('resolve', true)}
                                    checked={filters.resolve === true}
                                />
                                Reclamos resueltos
                            </label>
                            <label className="block mb-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4"
                                    name="filter"
                                    onChange={() => handleFilterChange('resolve', false)}
                                    checked={filters.resolve === false}
                                />
                                Reclamos no resueltos
                            </label>
                            <button
                                className="mt-4 px-2 py-1 text-sm bg-gray-300 text-black rounded hover:bg-gray-400"
                                onClick={clearFilters}
                            >
                                Quitar filtros
                            </button>
                        </div>
                    )}
                </div>

                {
                    filteredNotifications.length > 0 ?
                        <InfiniteScroll
                            dataLength={filteredNotifications.length}
                            next={() => setPage(page + 1)}
                            hasMore={filteredNotifications.length < notifications.length}
                            loader={<p className='text-[10px] w-full text-center text-font-color'>Loading more...</p>}
                            endMessage={<p className='text-[10px] w-full text-center text-font-color'>No hay más notificaciones</p>}
                            scrollableTarget="scrollableContainer"
                            className='flex flex-col gap-3 px-6 pb-4'
                        >
                            {filteredNotifications.map((not, index) => (
                                <NotificationBlock key={`notification_${index}`} notification={not} markAsRead={markAsRead} onDelete={handleDeleteNotification} />
                            ))}
                        </InfiniteScroll> :
                        <div className='text-font-color min-h-[300px] flex items-center justify-center'>
                            Sin notificaciones
                        </div>
                }
            </motion.div>
        </div>

    )
}

export default NotificationsDropdown