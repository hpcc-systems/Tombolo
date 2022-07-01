import React, { useMemo,  useState } from "react";
import { Select, message, Spin } from "antd";
import debounce from "lodash/debounce";
import { authHeader } from "../../../common/AuthHeader";

 export default function DebounceSelect({ fetchOptions, debounceTimeout = 800, formValues, ...props }) {
  const [search, setSearch] = useState({ loading: false, error: "", data: [] });

  const debounceFetcher = useMemo(() => {
    return debounce(async ({ searchString, clusterId, jobType }) => {
      if (searchString.length <= 3) return;
      if (!clusterId) return message.info("Please select cluster before searching");

      try {
        setSearch((prev) => ({ ...prev, loading: true, error: "" }));
        const options = {
          method: "POST",
          headers: authHeader(),
          body: JSON.stringify({
            keyword: searchString.trim(),
            clusterId,
            clusterType: jobType === "Query Publish" ? "roxie" : "",
          }),
        };

        const response = await fetch("/api/hpcc/read/jobsearch", options);

        if (!response.ok) {
          const error = new Error(response.statusText);
          error.status = response.status;
          throw error;
        }

        const suggestions = await response.json();
        setSearch((prev) => ({ prev, loading: false, data: suggestions }));
      } catch (error) {
        if (error.status === 422) {
          message.error("Some characters are not allowed in search, please check your input");
        } else {
          message.error("There was an error searching the job from cluster");
        }
        setSearch((prev) => ({ ...prev, loading: false, error: error.message }));
      }
    }, debounceTimeout);
  }, []);
  
  const onClear = () => setSearch({ loading: false, error: "", data: [] });
  const onSearch = (value) => debounceFetcher({ searchString: value, ...formValues });
  const notFoundContent = () => search.loading ? <Spin size="small" /> : null;

  return (
    <Select
      {...props}
      allowClear
      showSearch
      onClear={onClear}
      onSearch={onSearch}
      filterOption={false}
      loading={search.loading}
      notFoundContent={notFoundContent}
    >
    {
      search.loading ? (
        //  need to wrap a spinner in disabled select to make it visible in dropdown
        <Select.Option disabled>
          <Spin size="small" />
        </Select.Option>
      ) : (
        search.data.map((job) => {
          return (
            <Select.Option key={job.value} value={job.text}>
              {job.text}
            </Select.Option>
          );
        })
      )
    }
    </Select>
  );
}
