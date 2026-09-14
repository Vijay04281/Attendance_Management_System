const StatCard = ({
  title,
  value,
  subtitle
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">

      <h3 className="text-slate-500 text-sm">
        {title}
      </h3>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

      <p className="text-slate-400 text-sm mt-2">
        {subtitle}
      </p>

    </div>
  );
};

export default StatCard;