import { Toast } from '../components/common/toast';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const useToast = () => {
  const options = {
    position: 'bottom-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const toastSuccess = (title, message) => {
    toast.success(<Toast title={title} message={message} />, options);
  };

  const toastError = (title, message) => {
    toast.error(<Toast title={title} message={message} />, options);
  };

  const toastInfo = (title, message) => {
    toast.info(<Toast title={title} message={message} />, options);
  };

  const toastWarning = (title, message) => {
    toast.warn(<Toast title={title} message={message} />, options);
  };

  return {
    toastSuccess,
    toastError,
    toastInfo,
    toastWarning,
  };
};

export default useToast;
